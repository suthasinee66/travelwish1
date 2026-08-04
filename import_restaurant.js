import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  "https://haapvvcxcwixwdhlawdg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYXB2dmN4Y3dpeHdkaGxhd2RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1NTEyNCwiZXhwIjoyMDg4NTMxMTI0fQ.v7ldmb6_uYRUVl7uTQYe0ba8-LLD5cTU6yXfp9TQK5E"
);
const raw = fs.readFileSync("./restaurant.json", "utf8");
const json = JSON.parse(raw);

const restaurants = Object.values(json)[0];


const rows = restaurants.map(item => {

  const obj = {};

  for (const key in item) {
    obj[key.toLowerCase()] = item[key];
  }


  if (obj.place_location) {

    const [lat, lng] = obj.place_location
      .split(",")
      .map(Number);

    obj.latitude = lat;
    obj.longitude = lng;

    delete obj.place_location;
  }


  return obj;

});
console.log(
  "จำนวนข้อมูล:",
  rows.length
);


const chunkSize = 500;


async function importData(){

  for(let i = 0; i < rows.length; i += chunkSize){

    const chunk = rows.slice(
      i,
      i + chunkSize
    );


    const { error } = await supabase
      .from("restaurant")
      .upsert(
        chunk,
        {
          onConflict:"place_id",
          ignoreDuplicates:false
        }
      );


    if(error){
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