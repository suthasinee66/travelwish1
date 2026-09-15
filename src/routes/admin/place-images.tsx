
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Image,
  Loader2,
  Search,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Download,
  X,
} from "lucide-react";

export const Route = createFileRoute(
  "/admin/place-images"
)({
  component: PlaceImagesPage,
});

type PlaceType = "attraction" | "restaurant";

interface Place {
  att_id: string;
  name_th: string | null;
  province: string | null;
  images: string[] | null;
  google_place_id?: string | null;
}

function PlaceImagesPage() {
  const [places, setPlaces] = useState<Place[]>([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [selected, setSelected] =
    useState<Place | null>(null);

  const [urls, setUrls] =
    useState<string[]>([""]);

  const [type, setType] =
    useState<PlaceType>("attraction");

  const [syncingId, setSyncingId] =
    useState<string | null>(null);

  const [syncingAll, setSyncingAll] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  /* =========================================================
     Backend URL
  ========================================================= */

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5050/api";


  /* =========================================================
     Load Places
  ========================================================= */

  async function loadPlaces() {
    setLoading(true);

    setMessage(null);

    try {
      let allPlaces: Place[] = [];

      const pageSize = 1000;

      let from = 0;

      while (true) {
        const query =
          type === "attraction"
            ? supabase
                .from("attraction")
                .select(`
                  att_id,
                  name_th,
                  province,
                  images,
                  google_place_id
                `)
            : supabase
                .from("restaurant")
                .select(`
                  id,
                  place_name_th,
                  province_name_th,
                  images
                `);

        const {
          data,
          error,
        } = await query
          .order(
            type === "attraction"
              ? "name_th"
              : "place_name_th"
          )
          .range(
            from,
            from + pageSize - 1
          );

        if (error) {
          console.error(error);

          setMessage(
            "ไม่สามารถโหลดข้อมูลสถานที่ได้"
          );

          break;
        }

        if (!data || data.length === 0) {
          break;
        }

        const mapped: Place[] =
          type === "attraction"
            ? (data as Place[])
            : data.map((r: any) => ({
                att_id: r.id,
                name_th: r.place_name_th,
                province: r.province_name_th,
                images: r.images,
              }));

        allPlaces.push(...mapped);

        if (data.length < pageSize) {
          break;
        }

        from += pageSize;
      }

      setPlaces(allPlaces);

      console.log(
        "Loaded:",
        type,
        allPlaces.length
      );

    } catch (error) {
      console.error(error);

      setMessage(
        "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );

    } finally {
      setLoading(false);
    }
  }


  /* =========================================================
     Load when type changes
  ========================================================= */

  useEffect(() => {
    loadPlaces();
  }, [type]);


  /* =========================================================
     Open Manual Image Editor
  ========================================================= */

  function openEditor(place: Place) {
    setSelected(place);

    setUrls(
      place.images?.length
        ? [...place.images]
        : [""]
    );
  }


  /* =========================================================
     Add URL
  ========================================================= */

  function addUrl() {
    setUrls([
      ...urls,
      "",
    ]);
  }


  /* =========================================================
     Remove URL
  ========================================================= */

  function removeUrl(index: number) {
    setUrls(
      urls.filter(
        (_, i) => i !== index
      )
    );
  }


  /* =========================================================
     Change URL
  ========================================================= */

  function changeUrl(
    index: number,
    value: string
  ) {
    const copy = [...urls];

    copy[index] = value;

    setUrls(copy);
  }


  /* =========================================================
     Save Manual Images
  ========================================================= */

  async function saveImages() {
    if (!selected) {
      return;
    }

    try {
      const images =
        urls
          .map((url) => url.trim())
          .filter(Boolean);

      const table =
        type === "attraction"
          ? "attraction"
          : "restaurant";

      const idColumn =
        type === "attraction"
          ? "att_id"
          : "id";

      const {
        error,
      } = await supabase
        .from(table)
        .update({
          images,
        })
        .eq(
          idColumn,
          selected.att_id
        );

      if (error) {
        console.error(error);

        setMessage(
          "ไม่สามารถบันทึกรูปได้"
        );

        return;
      }

      setPlaces((prev) =>
        prev.map((item) =>
          item.att_id ===
          selected.att_id
            ? {
                ...item,
                images,
              }
            : item
        )
      );

      setSelected(null);

      setMessage(
        `บันทึกรูป ${images.length} รูปเรียบร้อยแล้ว`
      );

    } catch (error) {
      console.error(error);

      setMessage(
        "เกิดข้อผิดพลาดในการบันทึกรูป"
      );
    }
  }


  /* =========================================================
     Sync Google Images - Single Attraction
  ========================================================= */

  async function syncGoogleImages(
    place: Place
  ) {
    if (type !== "attraction") {
      return;
    }

    if (!place.google_place_id) {
      setMessage(
        `${place.name_th || "สถานที่นี้"} ไม่มี google_place_id`
      );

      return;
    }

    setSyncingId(place.att_id);

    setMessage(null);

    try {
      const response =
        await fetch(
          `${API_BASE}/google-image/sync/${encodeURIComponent(
            place.att_id
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );


      const result =
        await response.json();


      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "ไม่สามารถดึงรูปจาก Google ได้"
        );
      }


      const images =
        Array.isArray(result.images)
          ? result.images
          : [];


      setPlaces((prev) =>
        prev.map((item) =>
          item.att_id ===
          place.att_id
            ? {
                ...item,
                images,
              }
            : item
        )
      );


      if (selected?.att_id === place.att_id) {
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                images,
              }
            : prev
        );

        setUrls(
          images.length
            ? [...images]
            : [""]
        );
      }


      setMessage(
        images.length > 0
          ? `ดึงรูปจาก Google สำเร็จ ${images.length} รูป — ${place.name_th || ""}`
          : `Google ไม่มีรูปสำหรับ ${place.name_th || "สถานที่นี้"}`
      );

    } catch (error: any) {
      console.error(
        "Google image sync error:",
        error
      );

      setMessage(
        error?.message ||
          "ไม่สามารถดึงรูปจาก Google ได้"
      );

    } finally {
      setSyncingId(null);
    }
  }


  /* =========================================================
     Sync All Attractions
  ========================================================= */

  async function syncAllGoogleImages() {
    if (type !== "attraction") {
      return;
    }

    const confirmed =
      window.confirm(
        "ต้องการดึงรูปจาก Google ให้สถานที่ท่องเที่ยวทั้งหมดที่มี google_place_id หรือไม่?"
      );

    if (!confirmed) {
      return;
    }

    setSyncingAll(true);

    setMessage(null);

    try {
      const response =
        await fetch(
          `${API_BASE}/google-image/sync-attractions`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "ไม่สามารถ sync รูปทั้งหมดได้"
        );
      }


      /*
       * Backend ส่ง results กลับมา
       * เพื่อ update จำนวนรูปในหน้าเว็บ
       */

      if (
        Array.isArray(
          result.results
        )
      ) {
        setPlaces((prev) =>
          prev.map((place) => {

            const synced =
              result.results.find(
                (item: any) =>
                  item.att_id ===
                  place.att_id
              );

            if (
              synced?.success &&
              typeof synced.image_count ===
                "number"
            ) {
              /*
               * backend endpoint แบบ bulk
               * ไม่ได้ส่ง images กลับมา
               *
               * จึง reload จาก Supabase
               */
            }

            return place;
          })
        );
      }


      /*
       * โหลดข้อมูลใหม่จาก Supabase
       * เพื่อให้ images เป็นข้อมูลล่าสุด
       */

      await loadPlaces();


      const summary =
        result.summary;


      setMessage(
        `Sync เสร็จแล้ว — ทั้งหมด ${summary?.total ?? 0} รายการ | สำเร็จ ${summary?.success ?? 0} | ไม่มีรูป ${summary?.no_photo ?? 0} | ไม่มี Place ID ${summary?.no_place_id ?? 0} | Error ${summary?.error ?? 0}`
      );

    } catch (error: any) {
      console.error(
        "Sync all Google images error:",
        error
      );

      setMessage(
        error?.message ||
          "ไม่สามารถ sync รูปทั้งหมดได้"
      );

    } finally {
      setSyncingAll(false);
    }
  }


  /* =========================================================
     Filter
  ========================================================= */

  const filtered =
    places.filter((place) => {

      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return true;
      }

      return (
        place.name_th
          ?.toLowerCase()
          .includes(keyword) ||
        place.province
          ?.toLowerCase()
          .includes(keyword) ||
        place.google_place_id
          ?.toLowerCase()
          .includes(keyword)
      );
    });


  /* =========================================================
     Render
  ========================================================= */

  return (
    <div
      className="
        min-h-screen
        bg-gray-50
        p-8
      "
    >

      <div
        className="
          max-w-6xl
          mx-auto
        "
      >

        {/* =================================================
            Header
        ================================================= */}

        <div
          className="
            flex
            justify-between
            items-center
            mb-6
          "
        >

          <div>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              Place Images Manager
            </h1>

            <p
              className="
                text-gray-500
                mt-1
              "
            >
              จัดการรูปสถานที่จาก Google Places
            </p>

          </div>


          {/* Sync All */}

          {type === "attraction" && (
            <button
              onClick={
                syncAllGoogleImages
              }
              disabled={
                syncingAll ||
                loading
              }
              className="
                flex
                items-center
                gap-2
                px-5
                py-3
                rounded-lg
                bg-black
                text-white
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >

              {syncingAll ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Download size={18} />
              )}

              {syncingAll
                ? "กำลังดึงรูปทั้งหมด..."
                : "ดึงรูป Google ทั้งหมด"}

            </button>
          )}

        </div>


        {/* =================================================
            Message
        ================================================= */}

        {message && (
          <div
            className="
              bg-white
              border
              rounded-xl
              px-4
              py-3
              mb-5
              flex
              justify-between
              items-center
            "
          >

            <span>
              {message}
            </span>

            <button
              onClick={() =>
                setMessage(null)
              }
              className="
                text-gray-400
                hover:text-black
              "
            >
              <X size={18} />
            </button>

          </div>
        )}


        {/* =================================================
            Type
        ================================================= */}

        <div
          className="
            flex
            gap-3
            mb-5
          "
        >

          <button
            onClick={() =>
              setType("attraction")
            }
            className={`
              px-4
              py-2
              rounded-lg
              ${
                type === "attraction"
                  ? "bg-black text-white"
                  : "bg-gray-200"
              }
            `}
          >
            สถานที่ท่องเที่ยว
          </button>


          <button
            onClick={() =>
              setType("restaurant")
            }
            className={`
              px-4
              py-2
              rounded-lg
              ${
                type === "restaurant"
                  ? "bg-black text-white"
                  : "bg-gray-200"
              }
            `}
          >
            ร้านอาหาร
          </button>

        </div>


        {/* =================================================
            Search
        ================================================= */}

        <div
          className="
            bg-white
            rounded-xl
            p-4
            mb-6
            flex
            gap-3
            items-center
          "
        >

          <Search />

          <input
            className="
              flex-1
              outline-none
            "
            placeholder="
              ค้นหาสถานที่ / จังหวัด / Google Place ID
            "
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        {/* =================================================
            List
        ================================================= */}

        {loading ? (

          <div
            className="
              bg-white
              rounded-xl
              p-10
              flex
              justify-center
            "
          >
            <Loader2
              className="animate-spin"
            />
          </div>

        ) : (

          <div
            className="
              bg-white
              rounded-xl
              overflow-hidden
            "
          >

            {filtered.length === 0 ? (

              <div
                className="
                  p-10
                  text-center
                  text-gray-500
                "
              >
                ไม่พบสถานที่
              </div>

            ) : (

              filtered.map((place) => (

                <div
                  key={place.att_id}
                  className="
                    flex
                    justify-between
                    items-center
                    p-5
                    border-b
                    last:border-b-0
                    gap-5
                  "
                >

                  {/* Place Info */}

                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >

                    <h2
                      className="
                        font-semibold
                        truncate
                      "
                    >
                      {place.name_th}
                    </h2>


                    <p
                      className="
                        text-gray-500
                        text-sm
                      "
                    >
                      {place.province}
                    </p>


                    {/* Google Place ID */}

                    {type === "attraction" && (
                      <p
                        className="
                          text-xs
                          text-gray-400
                          mt-1
                          truncate
                        "
                        title={
                          place.google_place_id ||
                          ""
                        }
                      >
                        Google Place ID:{" "}
                        {place.google_place_id ||
                          "ไม่มี"}
                      </p>
                    )}


                    {/* Image status */}

                    <div
                      className="
                        flex
                        gap-2
                        items-center
                        mt-2
                        text-sm
                      "
                    >

                      {place.images?.length ? (

                        <>
                          <CheckCircle
                            size={18}
                          />

                          {place.images.length}
                          {" "}
                          รูป
                        </>

                      ) : (

                        <>
                          <Image
                            size={18}
                          />

                          ไม่มีรูป
                        </>

                      )}

                    </div>

                  </div>


                  {/* Actions */}

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      shrink-0
                    "
                  >

                    {/* Google Sync */}

                    {type === "attraction" && (
                      <button
                        onClick={() =>
                          syncGoogleImages(
                            place
                          )
                        }
                        disabled={
                          syncingId ===
                            place.att_id ||
                          !place.google_place_id ||
                          syncingAll
                        }
                        title={
                          !place.google_place_id
                            ? "ไม่มี google_place_id"
                            : "ดึงรูปจาก Google"
                        }
                        className="
                          px-4
                          py-2
                          rounded-lg
                          border
                          flex
                          items-center
                          gap-2
                          disabled:opacity-40
                          disabled:cursor-not-allowed
                        "
                      >

                        {syncingId ===
                        place.att_id ? (

                          <Loader2
                            size={18}
                            className="
                              animate-spin
                            "
                          />

                        ) : (

                          <Download
                            size={18}
                          />

                        )}

                        {syncingId ===
                        place.att_id
                          ? "กำลังดึง..."
                          : "ดึงจาก Google"}

                      </button>
                    )}


                    {/* Manual Editor */}

                    <button
                      onClick={() =>
                        openEditor(
                          place
                        )
                      }
                      className="
                        px-4
                        py-2
                        rounded-lg
                        bg-black
                        text-white
                      "
                    >
                      จัดการรูป
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        )}

      </div>


      {/* =====================================================
          Manual Image Editor Modal
      ===================================================== */}

      {selected && (

        <div
          className="
            fixed
            inset-0
            bg-black/40
            flex
            items-center
            justify-center
            p-5
            z-50
          "
        >

          <div
            className="
              bg-white
              rounded-xl
              p-6
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-y-auto
            "
          >

            {/* Modal Header */}

            <div
              className="
                flex
                justify-between
                items-start
                mb-4
              "
            >

              <div>

                <h2
                  className="
                    text-xl
                    font-bold
                  "
                >
                  {selected.name_th}
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                  "
                >
                  {selected.province}
                </p>

              </div>


              <button
                onClick={() =>
                  setSelected(null)
                }
                className="
                  text-gray-400
                  hover:text-black
                "
              >
                <X />
              </button>

            </div>


            {/* Google Place ID */}

            {type === "attraction" && (
              <div
                className="
                  bg-gray-50
                  rounded-lg
                  p-3
                  mb-5
                  text-sm
                "
              >

                <div
                  className="
                    text-gray-500
                    mb-1
                  "
                >
                  Google Place ID
                </div>

                <div
                  className="
                    font-mono
                    break-all
                  "
                >
                  {selected.google_place_id ||
                    "ไม่มี google_place_id"}
                </div>

              </div>
            )}


            {/* Google Sync */}

            {type === "attraction" && (
              <button
                onClick={() =>
                  syncGoogleImages(
                    selected
                  )
                }
                disabled={
                  syncingId ===
                    selected.att_id ||
                  !selected.google_place_id
                }
                className="
                  w-full
                  mb-5
                  px-4
                  py-3
                  rounded-lg
                  bg-black
                  text-white
                  flex
                  justify-center
                  items-center
                  gap-2
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >

                {syncingId ===
                selected.att_id ? (

                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                ) : (

                  <Download size={18} />

                )}

                {syncingId ===
                selected.att_id
                  ? "กำลังดึงรูปจาก Google..."
                  : "ดึงรูปจาก Google"}

              </button>
            )}


            {/* URL Inputs */}

            <div
              className="
                mb-4
              "
            >

              <div
                className="
                  font-semibold
                  mb-3
                "
              >
                Image URLs
              </div>


              {urls.map(
                (url, index) => (

                  <div
                    key={index}
                    className="
                      flex
                      gap-2
                      mb-3
                    "
                  >

                    <input
                      value={url}
                      onChange={(e) =>
                        changeUrl(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="
                        https://example.com/image.jpg
                      "
                      className="
                        flex-1
                        border
                        rounded-lg
                        px-3
                        py-2
                        outline-none
                        focus:ring-2
                        focus:ring-black
                      "
                    />


                    <button
                      onClick={() =>
                        removeUrl(
                          index
                        )
                      }
                      className="
                        px-3
                        text-gray-500
                        hover:text-red-500
                      "
                    >
                      <Trash2 />
                    </button>

                  </div>

                )
              )}

            </div>


            {/* Add URL */}

            <button
              onClick={addUrl}
              className="
                flex
                items-center
                gap-2
                mb-5
                text-sm
              "
            >

              <Plus />

              เพิ่ม URL

            </button>


            {/* Preview */}

            <div
              className="
                grid
                grid-cols-3
                gap-3
                mb-5
              "
            >

              {urls
                .filter(
                  (x) => x.trim()
                )
                .map(
                  (url, index) => (

                    <img
                      key={index}
                      src={url}
                      alt=""
                      className="
                        h-24
                        w-full
                        object-cover
                        rounded-lg
                        bg-gray-100
                      "
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />

                  )
                )}

            </div>


            {/* Modal Actions */}

            <div
              className="
                flex
                justify-end
                gap-3
              "
            >

              <button
                onClick={() =>
                  setSelected(null)
                }
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-gray-200
                "
              >
                ยกเลิก
              </button>


              <button
                onClick={saveImages}
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-black
                  text-white
                  flex
                  gap-2
                  items-center
                "
              >

                <Save size={18} />

                บันทึก

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

