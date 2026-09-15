import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();

    const attId = body.att_id;

    if (!attId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ไม่พบ att_id",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseSecretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY")!;

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
);

    // --------------------------------------------------
    // 1. โหลดสถานที่จาก Supabase
    // --------------------------------------------------

    const { data: attraction, error: attractionError } =
      await supabase
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
        .eq("att_id", attId)
        .single<Attraction>();

    if (attractionError || !attraction) {
      throw new Error(
        attractionError?.message || "ไม่พบสถานที่",
      );
    }

    // --------------------------------------------------
    // 2. ถ้ามี Google Place ID แล้ว
    //    ใช้ Place Details
    // --------------------------------------------------

    let place: GooglePlace | null = null;

    if (attraction.google_place_id) {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${attraction.google_place_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleApiKey,
            "X-Goog-FieldMask":
              "id,displayName,formattedAddress,rating,userRatingCount",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Google Place Details Error: ${errorText}`,
        );
      }

      place = await response.json();
    }

    // --------------------------------------------------
    // 3. ถ้ายังไม่มี Place ID
    //    ใช้ Text Search
    // --------------------------------------------------

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

      const textQuery = `${name}, ${location}`;

      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleApiKey,
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
        const errorText = await response.text();

        throw new Error(
          `Google Text Search Error: ${errorText}`,
        );
      }

      const result = await response.json();

      place = result.places?.[0] ?? null;
    }

    // --------------------------------------------------
    // 4. Google หาไม่เจอ
    // --------------------------------------------------

    if (!place) {
      return new Response(
        JSON.stringify({
          success: false,
          att_id: attraction.att_id,
          message: "ไม่พบสถานที่บน Google Maps",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------
    // 5. เตรียมข้อมูล
    // --------------------------------------------------

    const rating =
      typeof place.rating === "number"
        ? place.rating
        : 0;

    const visitorCount =
      typeof place.userRatingCount === "number"
        ? place.userRatingCount
        : 0;

    // --------------------------------------------------
    // 6. UPDATE Supabase
    // --------------------------------------------------

    const { error: updateError } =
      await supabase
        .from("attraction")
        .update({
          google_place_id:
            place.id ??
            attraction.google_place_id ??
            null,

          avg_rating: rating,

          visitor_count: visitorCount,

          updated_at: new Date().toISOString(),
        })
        .eq("att_id", attraction.att_id);

    if (updateError) {
      throw new Error(
        `Supabase Update Error: ${updateError.message}`,
      );
    }

    // --------------------------------------------------
    // 7. ส่งผลกลับ
    // --------------------------------------------------

    return new Response(
      JSON.stringify({
        success: true,

        attraction: {
          att_id: attraction.att_id,
          name:
            attraction.name_th ||
            attraction.name_en,
        },

        google: {
          place_id: place.id,
          name: place.displayName?.text ?? null,
          address:
            place.formattedAddress ?? null,
          rating,
          user_rating_count: visitorCount,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาด",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});