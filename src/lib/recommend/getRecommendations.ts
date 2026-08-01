import { supabase } from "@/lib/supabase";
import { getPlaceImage } from "@/lib/google/places";

export const getRecommendations = async (pref: any) => {
  if (!pref) return [];

  let allData: any[] = [];
const pageSize = 1000;
let from = 0;

while (true) {
  const { data, error } = await supabase
    .from("attraction")
    .select("*")
    .range(from, from + pageSize - 1);

  if (error) {
    console.error(error);
    return [];
  }

  if (!data || data.length === 0) break;

  allData.push(...data);

  if (data.length < pageSize) break;

  from += pageSize;
}
console.log("========== LOAD DATA ==========");
console.log("จำนวนสถานที่ทั้งหมด:", allData.length);


console.log("========== USER PREF ==========");
console.log(JSON.stringify(pref, null, 2));


const recommendations = allData.map((place: any) => {
  let score = 0;

  if (pref.travel_type?.length) {
    const matches =
      place.travel_type?.filter((x: string) =>
        pref.travel_type.includes(x)
      ).length || 0;

    score += matches * 3;
  }

  if (pref.activities?.length) {
    const matches =
      place.activities?.filter((x: string) =>
        pref.activities.includes(x)
      ).length || 0;

    score += matches * 2;
  }

  if (
    pref.atmosphere &&
    place.atmosphere?.includes(pref.atmosphere)
  ) {
    score += 2;
  }

  if (
    pref.budget &&
    place.budget?.includes(pref.budget)
  ) {
    score += 1;
  }

  if (
    pref.travel_companion &&
    place.travel_companion?.includes(pref.travel_companion)
  ) {
    score += 1;
  }


  return {
    ...place,
    score,
  };
});



console.log("========== BEFORE SORT ==========");
console.table(
  recommendations
    .filter((x) => x.score > 0)
    .map((x) => ({
      id: x.att_id,
      name: x.name_th,
      province: x.province,
      score: x.score
    }))
);



const topPlaces = recommendations
  .filter((x) => x.score > 0)
  .sort((a, b) => b.score - a.score)
  .filter(
    (place, index, self) =>
      index === self.findIndex(
        (p) =>
          p.name_th === place.name_th &&
          p.province === place.province
      )
  )
  .slice(0, 50);;



console.log("========== AFTER REMOVE DUP ==========");
console.table(
  topPlaces.map((x) => ({
    id: x.att_id,
    name: x.name_th,
    province: x.province,
    score: x.score
  }))
);


const result = await Promise.all(
  topPlaces.map(async (place) => {

    // ✅ มีรูปใน Supabase แล้ว
    if (
      place.images &&
      place.images.length >= 5
    ) {

      console.log(
        "ใช้รูปจาก Supabase:",
        place.name_th
      );

      return {
        ...place,
        images: place.images
      };
    }


    // ❌ ไม่มีรูป ค่อยเรียก API
    console.log(
      "เรียก SerpAPI:",
      place.name_th
    );


    const images = await getPlaceImage(
      place.name_th,
      place.province
    );


    // บันทึกกลับ Supabase
    if(images && images.length > 0){

      await supabase
        .from("attraction")
        .update({
          images
        })
        .eq(
          "att_id",
          place.att_id
        );

    }


    return {
      ...place,
      images
    };

  })
);


console.log("========== FINAL RESULT ==========");
console.table(
  result.map((x)=>({
    id:x.att_id,
    name:x.name_th,
    province:x.province
  }))
);


return result;

  
};