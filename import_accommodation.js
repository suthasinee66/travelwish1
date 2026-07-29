import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  "https://haapvvcxcwixwdhlawdg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYXB2dmN4Y3dpeHdkaGxhd2RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1NTEyNCwiZXhwIjoyMDg4NTMxMTI0fQ.v7ldmb6_uYRUVl7uTQYe0ba8-LLD5cTU6yXfp9TQK5E"
);
const raw = fs.readFileSync("./accommodation.json", "utf8");

const json = JSON.parse(raw);


// ดึง array ที่ซ่อนอยู่ใน key SQL
const accommodations = Object.values(json)[0];


console.log(
  "จำนวนข้อมูล:",
  accommodations.length
);

// แปลงชื่อ column
function convertKey(key) {

  return key
    .toLowerCase();

}



const rows = accommodations.map(item => {


  let latitude = null;
  let longitude = null;


  if(item.ACC_LOCATION){

    const [lat,lng] = item.ACC_LOCATION.split(",");

    latitude = Number(lat);
    longitude = Number(lng);

  }



  const row = {};


  Object.keys(item).forEach(key => {


    row[convertKey(key)] = item[key];


  });



  // เพิ่ม latitude longitude
  row.latitude = latitude;
  row.longitude = longitude;


  return row;


});



const chunkSize = 500;



async function importData(){


  for(let i=0;i<rows.length;i+=chunkSize){


    const chunk = rows.slice(
      i,
      i + chunkSize
    );



    const {data,error} = await supabase
      .from("accommodation")
      .upsert(
        chunk,
        {
          onConflict:"acc_id",
          ignoreDuplicates:false
        }
      );



    if(error){

      console.log(error);
      return;

    }



    console.log(
      `Imported ${Math.min(i+chunkSize,rows.length)} / ${rows.length}`
    );


  }


  console.log("Finished");


}



importData();