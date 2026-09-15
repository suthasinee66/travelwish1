import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:8080",
  }),
);

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const googleApiKey =
  process.env.GOOGLE_PLACES_API_KEY;

if (!supabaseUrl) {
  throw new Error("ไม่พบ SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "ไม่พบ SUPABASE_SERVICE_ROLE_KEY",
  );
}

if (!googleApiKey) {
  throw new Error(
    "ไม่พบ GOOGLE_PLACES_API_KEY",
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
);

interface Attraction {
  att_id: string;
  name_th: string | null;
  name_en: string | null;
  province: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
}

interface GooglePlace {
  id?: string;

  displayName?: {
    text?: string;
  };

  formattedAddress?: string;

  rating?: number;

  userRatingCount?: number;
}

/*
|--------------------------------------------------------------------------
| POST /api/update-rating
|--------------------------------------------------------------------------
*/

app.post(
  "/api/update-rating",
  async (req, res) => {
    try {
      const { att_id } = req.body;

      if (!att_id) {
        return res.status(400).json({
          success: false,
          error: "ไม่พบ att_id",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | 1. โหลดสถานที่จาก Supabase
      |--------------------------------------------------------------------------
      */

      const {
        data: attraction,
        error: attractionError,
      } = await supabase
        .from("attraction")
        .select(`
          att_id,
          name_th,
          name_en,
          province,
          district,
          latitude,
          longitude,
          google_place_id
        `)
        .eq("att_id", att_id)
        .single<Attraction>();

      if (
        attractionError ||
        !attraction
      ) {
        return res.status(404).json({
          success: false,
          error:
            attractionError?.message ||
            "ไม่พบสถานที่",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | 2. Google Place
      |--------------------------------------------------------------------------
      */

      let place: GooglePlace | null =
        null;

      /*
      |--------------------------------------------------------------------------
      | 3. ถ้ามี Google Place ID
      |    ใช้ Place Details
      |--------------------------------------------------------------------------
      */

      if (
        attraction.google_place_id
      ) {
        const response =
          await fetch(
            `https://places.googleapis.com/v1/places/${attraction.google_place_id}`,
            {
              method: "GET",

              headers: {
                "Content-Type":
                  "application/json",

                "X-Goog-Api-Key":
                  googleApiKey,

                "X-Goog-FieldMask":
                  "id,displayName,formattedAddress,rating,userRatingCount",
              },
            },
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `Google Place Details Error: ${errorText}`,
          );
        }

        place =
          (await response.json()) as GooglePlace;
      }

      /*
      |--------------------------------------------------------------------------
      | 4. ถ้ายังไม่มี Place ID
      |    ใช้ Text Search
      |--------------------------------------------------------------------------
      */

      if (!place) {
        const name =
          attraction.name_th ||
          attraction.name_en ||
          "";

        const location = [
          attraction.district,
          attraction.province,
          "Thailand",
        ]
          .filter(Boolean)
          .join(", ");

        const textQuery =
          `${name}, ${location}`;

        const response =
          await fetch(
            "https://places.googleapis.com/v1/places:searchText",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "X-Goog-Api-Key":
                  googleApiKey,

                "X-Goog-FieldMask":
                  "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
              },

              body: JSON.stringify({
                textQuery,

                languageCode: "th",

                regionCode: "TH",

                maxResultCount: 1,
              }),
            },
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `Google Text Search Error: ${errorText}`,
          );
        }

        const result =
          await response.json();

        place =
          result.places?.[0] ??
          null;
      }

      /*
      |--------------------------------------------------------------------------
      | 5. Google หาไม่เจอ
      |--------------------------------------------------------------------------
      */

      if (!place) {
        return res.status(404).json({
          success: false,

          att_id:
            attraction.att_id,

          message:
            "ไม่พบสถานที่บน Google Maps",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | 6. Rating
      |--------------------------------------------------------------------------
      */

      const rating =
        typeof place.rating ===
        "number"
          ? place.rating
          : 0;

      const visitorCount =
        typeof place.userRatingCount ===
        "number"
          ? place.userRatingCount
          : 0;

      /*
      |--------------------------------------------------------------------------
      | 7. UPDATE Supabase
      |--------------------------------------------------------------------------
      */

      const {
        error: updateError,
      } = await supabase
        .from("attraction")
        .update({
          google_place_id:
            place.id ??
            attraction.google_place_id ??
            null,

          avg_rating: rating,

          visitor_count:
            visitorCount,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "att_id",
          attraction.att_id,
        );

      if (updateError) {
        throw new Error(
          `Supabase Update Error: ${updateError.message}`,
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 8. Response
      |--------------------------------------------------------------------------
      */

      return res.json({
        success: true,

        attraction: {
          att_id:
            attraction.att_id,

          name:
            attraction.name_th ||
            attraction.name_en,
        },

        google: {
          place_id:
            place.id ?? null,

          name:
            place.displayName?.text ??
            null,

          address:
            place.formattedAddress ??
            null,

          rating,

          user_rating_count:
            visitorCount,
        },
      });
    } catch (error) {
      console.error(
        "Update rating error:",
        error,
      );

      return res.status(500).json({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาด",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    `Google Rating Server running at http://localhost:${PORT}`,
  );
});