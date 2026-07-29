const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export async function getPlaceImage(
  placeName: string,
  province?: string
) {
  const res = await fetch(
    `http://localhost:5000/api/place-image?name=${encodeURIComponent(
      placeName
    )}&province=${encodeURIComponent(province || "")}`
  );

  const json = await res.json();

  console.group("🖼️ Place Image");
  console.log("attid :", placeName);
  console.log("Place :", placeName);
  console.log("Province :", province);
  console.log("Images :", json.images);
  console.groupEnd();


  return json.images;


  } 