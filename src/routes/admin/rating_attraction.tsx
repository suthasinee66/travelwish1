import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/rating_attraction")({
  component: RouteComponent,
});

interface Attraction {
  att_id: string;
  name_th: string | null;
  name_en: string | null;
  province: string | null;
  district: string | null;
  google_place_id: string | null;
  avg_rating: number | null;
  visitor_count: number | null;
}

interface UpdateResult {
  success: boolean;

  attraction?: {
    att_id: string;
    name: string | null;
  };

  google?: {
    place_id: string | null;
    name: string | null;
    address: string | null;
    rating: number;
    user_rating_count: number;
  };

  message?: string;
  error?: string;
}

function RouteComponent() {
  const [attractions, setAttractions] =
    useState<Attraction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [updatingAll, setUpdatingAll] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadAttractions();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | โหลด Attraction จาก Supabase
  |--------------------------------------------------------------------------
  */
async function loadAttractions() {
  setLoading(true);
  setMessage("");

  try {
    const pageSize = 1000;
    let from = 0;
    let allAttractions: Attraction[] = [];

    while (true) {
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("attraction")
        .select(`
          att_id,
          name_th,
          name_en,
          province,
          district,
          google_place_id,
          avg_rating,
          visitor_count
        `)
        .order("name_th", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      allAttractions = [
        ...allAttractions,
        ...data,
      ];

      console.log(
        `โหลดแล้ว ${allAttractions.length} รายการ`,
      );

      // ถ้าได้น้อยกว่า 1000 แปลว่าเป็นชุดสุดท้าย
      if (data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    setAttractions(allAttractions);

    console.log(
      `โหลด Attraction ทั้งหมด ${allAttractions.length} รายการ`,
    );
  } catch (error) {
    console.error(
      "Load attractions error:",
      error,
    );

    setMessage(
      error instanceof Error
        ? `โหลดข้อมูลไม่สำเร็จ: ${error.message}`
        : "โหลดข้อมูลไม่สำเร็จ",
    );
  } finally {
    setLoading(false);
  }
}

  /*
  |--------------------------------------------------------------------------
  | Update Rating ของสถานที่ 1 แห่ง
  |--------------------------------------------------------------------------
  */

  async function updateRating(attId: string) {
    setUpdatingId(attId);
    setMessage("");

    try {
      /*
      |--------------------------------------------------------------------------
      | เรียก Node.js Server
      |--------------------------------------------------------------------------
      */

      const response = await fetch(
        "http://localhost:3000/api/update-rating",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            att_id: attId,
          }),
        },
      );

      const result =
        (await response.json()) as UpdateResult;

      /*
      |--------------------------------------------------------------------------
      | ตรวจสอบ Error
      |--------------------------------------------------------------------------
      */

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            result.message ||
            "ไม่สามารถอัปเดต Rating ได้",
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Update UI ทันที
      |--------------------------------------------------------------------------
      */

      setAttractions((current) =>
        current.map((item) =>
          item.att_id === attId
            ? {
                ...item,

                google_place_id:
                  result.google?.place_id ??
                  item.google_place_id,

                avg_rating:
                  result.google?.rating ??
                  item.avg_rating,

                visitor_count:
                  result.google
                    ?.user_rating_count ??
                  item.visitor_count,
              }
            : item,
        ),
      );

      /*
      |--------------------------------------------------------------------------
      | แสดงผล
      |--------------------------------------------------------------------------
      */

      setMessage(
        `อัปเดต ${
          result.attraction?.name ??
          attId
        } สำเร็จ ⭐ ${
          result.google?.rating ?? "-"
        } (${
          result.google?.user_rating_count?.toLocaleString() ??
          0
        } reviews)`,
      );
    } catch (error) {
      console.error(
        "Update rating error:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาด",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Update ทุกสถานที่
  |--------------------------------------------------------------------------
  */
async function updateAll() {
  if (
    updatingId ||
    updatingAll ||
    attractions.length === 0
  ) {
    return;
  }

  // เฉพาะสถานที่ที่ยังไม่มี Google Place ID
  const attractionsWithoutPlaceId =
    attractions.filter(
      (attraction) =>
        !attraction.google_place_id,
    );

  if (attractionsWithoutPlaceId.length === 0) {
    setMessage(
      "ทุกสถานที่มี Google Place ID แล้ว ไม่ต้องค้นหาใหม่",
    );
    return;
  }

  setUpdatingAll(true);
  setMessage(
    `พบ ${attractionsWithoutPlaceId.length.toLocaleString()} สถานที่ที่ยังไม่มี Google Place ID`,
  );

  try {
    let successCount = 0;
    let errorCount = 0;

    for (
      const attraction of attractionsWithoutPlaceId
    ) {
      try {
        await updateRating(
          attraction.att_id,
        );

        successCount++;

        setMessage(
          `กำลังอัปเดต ${successCount}/${attractionsWithoutPlaceId.length} ` +
          `สำเร็จ • ข้ามสถานที่ที่มี Place ID แล้ว`,
        );
      } catch (error) {
        errorCount++;

        console.error(
          `Update ${attraction.att_id} error:`,
          error,
        );
      }
    }

    setMessage(
      `เสร็จแล้ว ✅ สำเร็จ ${successCount.toLocaleString()} รายการ ` +
      `❌ ไม่สำเร็จ ${errorCount.toLocaleString()} รายการ ` +
      `จากทั้งหมด ${attractionsWithoutPlaceId.length.toLocaleString()} รายการ`,
    );
  } finally {
    setUpdatingAll(false);
  }
}

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="p-6">
        กำลังโหลดสถานที่...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 p-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Google Rating
          </h1>

          <p className="text-gray-500">
            โหลดคะแนนและจำนวนผู้ให้คะแนนจาก Google Maps
          </p>
        </div>

        <button
          onClick={updateAll}
          disabled={
            !!updatingId ||
            updatingAll ||
            attractions.length === 0
          }
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updatingAll
            ? "กำลังอัปเดต..."
            : "🔄 อัปเดตทั้งหมด"}
        </button>
      </div>

      {/* Message */}

      {message && (
        <div className="rounded-lg bg-gray-100 p-3">
          {message}
        </div>
      )}

      {/* Table */}

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  สถานที่
                </th>

                <th className="px-4 py-3 text-left">
                  จังหวัด
                </th>

                <th className="px-4 py-3 text-center">
                  Rating
                </th>

                <th className="px-4 py-3 text-center">
                  จำนวนผู้ให้คะแนน
                </th>

                <th className="px-4 py-3 text-center">
                  Google Place
                </th>

                <th className="px-4 py-3 text-center">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {attractions.map(
                (attraction) => (
                  <tr
                    key={attraction.att_id}
                    className="border-t"
                  >
                    {/* สถานที่ */}

                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {attraction.name_th ||
                          attraction.name_en ||
                          "-"}
                      </div>

                      <div className="text-xs text-gray-400">
                        {attraction.att_id}
                      </div>
                    </td>

                    {/* จังหวัด */}

                    <td className="px-4 py-3">
                      {attraction.province ||
                        "-"}
                    </td>

                    {/* Rating */}

                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold">
                        ⭐{" "}
                        {attraction.avg_rating !=
                        null
                          ? attraction.avg_rating.toFixed(
                              1,
                            )
                          : "0.0"}
                      </span>
                    </td>

                    {/* จำนวนผู้ให้คะแนน */}

                    <td className="px-4 py-3 text-center">
                      {(
                        attraction.visitor_count ??
                        0
                      ).toLocaleString()}
                    </td>

                    {/* Google Place */}

                    <td className="px-4 py-3 text-center">
                      {attraction.google_place_id ? (
                        <span className="text-green-600">
                          ✓ Found
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          ยังไม่มี
                        </span>
                      )}
                    </td>

                    {/* Action */}

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          updateRating(
                            attraction.att_id,
                          )
                        }
                        disabled={
                          updatingId ===
                          attraction.att_id ||
                          updatingAll
                        }
                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingId ===
                        attraction.att_id
                          ? "กำลังโหลด..."
                          : "โหลด Rating"}
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* จำนวนทั้งหมด */}

      <div className="text-sm text-gray-500">
        ทั้งหมด{" "}
        {attractions.length.toLocaleString()}{" "}
        สถานที่
      </div>
    </div>
  );
}

