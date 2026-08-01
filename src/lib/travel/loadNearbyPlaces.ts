import { supabase } from "@/lib/supabase";

function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export async function loadNearbyPlaces() {
  console.time("Nearby Total");

  console.log("1. get user");

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return [];

  console.log("2. get location");

 const {
  data: location,
  error,
} = await supabase
  .from("user_locations")
  .select("*")
  .eq("user_id", userData.user.id)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();

console.log("location =", location);
console.log("error =", error);

  if (!location) return [];

  console.log(location);

  console.time("Load attraction");

let places: any[] = [];

const pageSize = 1000;
let from = 0;

while (true) {
  const { data, error } = await supabase
    .from("attraction")
    .select("*")
    .range(from, from + pageSize - 1);

  if (error) {
    console.log(error);
    break;
  }

  if (!data || data.length === 0) break;

  places.push(...data);

  console.log(`โหลดแล้ว ${places.length} รายการ`);

  if (data.length < pageSize) break;

  from += pageSize;
}

console.timeEnd("Load attraction");

console.log("จำนวนสถานที่ทั้งหมด", places.length);

  console.time("Calculate");

  const result =
    places
      ?.map((place: any) => ({
        ...place,
        distance: getDistance(
          location.latitude,
          location.longitude,
          place.latitude,
          place.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50);

  console.timeEnd("Calculate");

  console.timeEnd("Nearby Total");

  return result ?? [];
}