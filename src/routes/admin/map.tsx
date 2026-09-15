import { createFileRoute } from "@tanstack/react-router";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { useEffect, useState } from "react";

import "leaflet/dist/leaflet.css";

// --------------------------------------------------
// แก้ path นี้ให้ตรงกับ Supabase client ของโปรเจกต์
// --------------------------------------------------
import { supabase } from "@/lib/supabase";


/*
==================================================
 Route
==================================================
*/

export const Route = createFileRoute("/admin/map")({
  component: RouteComponent,
});


/*
==================================================
 Type
==================================================
*/

interface Attraction {

  att_id: string;

  name_th: string | null;

  name_en: string | null;

  province: string | null;

  district: string | null;

  subdistrict: string | null;

  latitude: number | null;

  longitude: number | null;

  type: string | null;

  category: string[] | null;

  travel_type: string[] | null;

  activities: string[] | null;

  atmosphere: string[] | null;

  avg_rating: number | null;

  visitor_count: number | null;

}


/*
==================================================
 Leaflet Icon
==================================================
*/

const attractionIcon = L.icon({

  iconRetinaUrl:
    markerIcon2x,

  iconUrl:
    markerIcon,

  shadowUrl:
    markerShadow,

  iconSize: [
    25,
    41,
  ],

  iconAnchor: [
    12,
    41,
  ],

  popupAnchor: [
    1,
    -34,
  ],

  shadowSize: [
    41,
    41,
  ],

});


/*
==================================================
 Chiang Mai Center
==================================================
*/

const CHIANG_MAI_CENTER: [
  number,
  number
] = [

  18.7883,
  98.9853,

];


/*
==================================================
 Component
==================================================
*/

function RouteComponent() {

  const [
    attractions,
    setAttractions
  ] = useState<Attraction[]>([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState<string | null>(null);


  /*
  ==================================================
   ดึงข้อมูลเชียงใหม่
  ==================================================
  */

  useEffect(() => {

    async function fetchChiangMaiAttractions() {

      setLoading(true);

      setError(null);


      const {
        data,
        error
      } = await supabase

        .from("attraction")

        .select(`
          att_id,
          name_th,
          name_en,
          province,
          district,
          subdistrict,
          latitude,
          longitude,
          type,
          category,
          travel_type,
          activities,
          atmosphere,
          avg_rating,
          visitor_count
        `)

        .eq(
          "province",
          "เชียงใหม่"
        )

        .not(
          "latitude",
          "is",
          null
        )

        .not(
          "longitude",
          "is",
          null
        );


      if (error) {

        console.error(
          "โหลดข้อมูล attraction ไม่สำเร็จ:",
          error
        );

        setError(
          error.message
        );

        setLoading(false);

        return;

      }


      console.log(
        "เชียงใหม่ attractions:",
        data
      );


      setAttractions(
        (data ?? []) as Attraction[]
      );


      setLoading(false);

    }


    fetchChiangMaiAttractions();

  }, []);


  /*
  ==================================================
   Loading
  ==================================================
  */

  if (loading) {

    return (

      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >

        กำลังโหลดสถานที่ท่องเที่ยวเชียงใหม่...

      </div>

    );

  }


  /*
  ==================================================
   Error
  ==================================================
  */

  if (error) {

    return (

      <div
        style={{
          padding: "30px",
          color: "red",
        }}
      >

        <h2>
          โหลดข้อมูลไม่สำเร็จ
        </h2>

        <p>
          {error}
        </p>

      </div>

    );

  }


  /*
  ==================================================
   Map
  ==================================================
  */

  return (

    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
      }}
    >

      {/* ==========================================
          Information
      ========================================== */}

      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          top: "15px",
          left: "15px",
          background: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >

        <strong>
          สถานที่ท่องเที่ยวจังหวัดเชียงใหม่
        </strong>

        <div
          style={{
            marginTop: "4px",
          }}
        >

          ทั้งหมด{" "}
          <strong>
            {attractions.length}
          </strong>{" "}
          แห่ง

        </div>

      </div>


      {/* ==========================================
          Map
      ========================================== */}

      <MapContainer

        center={
          CHIANG_MAI_CENTER
        }

        zoom={9}

        scrollWheelZoom={true}

        style={{
          width: "100%",
          height: "100%",
        }}

      >

        {/* ========================================
            OpenStreetMap
        ======================================== */}

        <TileLayer

          attribution='&copy; OpenStreetMap contributors'

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        />


        {/* ========================================
            Attraction Markers
        ======================================== */}

        {attractions.map(
          (attraction) => (

            <Marker

              key={
                attraction.att_id
              }

              position={[

                attraction.latitude!,

                attraction.longitude!,

              ]}

              icon={
                attractionIcon
              }

            >

              <Popup>

                <div
                  style={{
                    minWidth: "220px",
                  }}
                >

                  {/* ชื่อ */}

                  <h3
                    style={{
                      margin:
                        "0 0 8px 0",
                    }}
                  >

                    {
                      attraction.name_th
                      ??
                      attraction.name_en
                      ??
                      "ไม่ระบุชื่อ"
                    }

                  </h3>


                  {/* จังหวัด */}

                  <div>

                    <strong>
                      จังหวัด:
                    </strong>{" "}

                    {
                      attraction.province
                      ??
                      "-"
                    }

                  </div>


                  {/* อำเภอ */}

                  <div>

                    <strong>
                      อำเภอ:
                    </strong>{" "}

                    {
                      attraction.district
                      ??
                      "-"
                    }

                  </div>


                  {/* ตำบล */}

                  <div>

                    <strong>
                      ตำบล:
                    </strong>{" "}

                    {
                      attraction.subdistrict
                      ??
                      "-"
                    }

                  </div>


                  {/* Type */}

                  <div>

                    <strong>
                      ประเภท:
                    </strong>{" "}

                    {
                      attraction.type
                      ??
                      "-"
                    }

                  </div>


                  {/* Rating */}

                  <div>

                    <strong>
                      Rating:
                    </strong>{" "}

                    {
                      attraction.avg_rating
                      ??
                      0
                    }

                  </div>


                  {/* Visitor */}

                  <div>

                    <strong>
                      ผู้เข้าชม:
                    </strong>{" "}

                    {
                      attraction.visitor_count
                      ??
                      0
                    }

                  </div>


                  {/* Coordinates */}

                  <hr />

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >

                    Lat:{" "}
                    {
                      attraction.latitude
                    }

                    <br />

                    Lng:{" "}
                    {
                      attraction.longitude
                    }

                  </div>

                </div>

              </Popup>

            </Marker>

          )
        )}

      </MapContainer>

    </div>

  );

}