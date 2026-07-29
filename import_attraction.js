import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  "https://haapvvcxcwixwdhlawdg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYXB2dmN4Y3dpeHdkaGxhd2RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1NTEyNCwiZXhwIjoyMDg4NTMxMTI0fQ.v7ldmb6_uYRUVl7uTQYe0ba8-LLD5cTU6yXfp9TQK5E"
);

// อ่านไฟล์ JSON
const raw = fs.readFileSync("./attractionnew.json", "utf8");

const json = JSON.parse(raw);

// เปลี่ยนชื่อตรงนี้ให้ตรงกับไฟล์ของคุณ
const attractionnew =
  json["SELECT \n    ATTRACTION.*,\n    MD_REGION.REGION_NAME_TH,\n    MD_PROVINCE.PROVINCE_NAME_TH,\n    MD_DISTRICT.DISTRICT_NAME_TH,\n    MD_SUBDISTRICT.SUBDISTRICT_NAME_TH,\n    MD_ATTRACTION_TYPE.ATTR_TYPE_TH AS ATT_CATEGORY_LABEL,\n    MD_ATTRACTION_SUB_TYPE.ATTR_SUB_TYPE_TH AS ATT_TYPE_LABEL\nFROM TAT.ATTRACTION\nLEFT JOIN MD_ATTRACTION_TYPE ON MD_ATTRACTION_TYPE.ATTR_TYPE_ID = ATTRACTION.ATT_CATEGORY\nLEFT JOIN MD_ATTRACTION_SUB_TYPE ON MD_ATTRACTION_SUB_TYPE.ATTR_SUB_TYPE_ID = ATTRACTION.ATT_TYPE\nLEFT JOIN MD_PROVINCE ON MD_PROVINCE.PROVINCE_ID = ATTRACTION.ATT_PROVINCE_ID\nLEFT JOIN MD_REGION ON MD_REGION.REGION_ID = ATTRACTION.ATT_REGION_ID\nLEFT JOIN MD_DISTRICT ON MD_DISTRICT.DISTRICT_ID = ATTRACTION.ATT_DISTRICT_ID\nLEFT JOIN MD_SUBDISTRICT ON MD_SUBDISTRICT.SUBDISTRICT_ID = ATTRACTION.ATT_SUBDISTRICT_ID\nWHERE ATTRACTION.STATUS_DATA = 1\nORDER BY ATTRACTION.ATT_ID DESC"];

const rows = attractionnew.map((item) => {

    let lat = null;
    let lng = null;

    if (item.ATT_LOCATION) {
        const arr = item.ATT_LOCATION.split(",");
        lat = Number(arr[0]);
        lng = Number(arr[1]);
    }

    return {
        att_id: item.ATT_ID,
        name_th: item.ATT_NAME_TH,
        name_en: item.ATT_NAME_EN,

        detail_th: item.ATT_DETAIL_TH,
        detail_en: item.ATT_DETAIL_EN,

        category: item.ATT_CATEGORY_LABEL,
        type: item.ATT_TYPE_LABEL,

        region: item.REGION_NAME_TH,
        province: item.PROVINCE_NAME_TH,
        district: item.DISTRICT_NAME_TH,
        subdistrict: item.SUBDISTRICT_NAME_TH,

        latitude: lat,
        longitude: lng,

        highlight: item.ATT_HILIGHT,

        activity: item.ATT_ACTIVITY,

        suitable_duration: item.ATT_SUITABLE_DURATION,

        tel: item.ATT_TEL,
        email: item.ATT_EMAIL,
        website: item.ATT_WEBSITE,
        facebook: item.ATT_FACEBOOK,

        payment: item.ATT_PAYMENT === "y",

        created_at: item.ATT_CREATED_DATE,
        updated_at: item.ATT_UPDATED_DATE
    };
});

const chunkSize = 500;

async function importData() {

    for (let i = 0; i < rows.length; i += chunkSize) {

        const chunk = rows.slice(i, i + chunkSize);

        const { error } = await supabase
    .from("attractionnew")
    .upsert(chunk, {
        onConflict: "att_id",
        ignoreDuplicates: true
    });

        if (error) {
            console.log(error);
            return;
        }

        console.log(
            `Imported ${Math.min(i + chunkSize, rows.length)} / ${rows.length}`
        );
    }

    console.log("Finished");
}

importData();
