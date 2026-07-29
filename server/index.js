import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

const app = express();

app.use(cors());

async function checkImage(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      responseType: "stream",
    });

    const contentType = response.headers["content-type"];

    return (
      response.status === 200 &&
      contentType &&
      contentType.startsWith("image")
    );

  } catch (error) {
    return false;
  }
}
app.get("/api/place-image", async (req, res) => {
  try {
    const { name, province } = req.query;

    const query = `${name} ${province} Thailand scenic landscape viewpoint travel photography`;

    const result = await axios.get(
      "https://serpapi.com/search.json",
      {
        params: {
          engine: "google_images",
          q: query,
          num: 20,
          api_key: process.env.SERP_API_KEY,
        },
      }
    );
console.log("===== QUERY =====");
console.log(query);

console.log("===== RESULT =====");
console.log(JSON.stringify(result.data, null, 2));

    const images = result.data.images_results || [];


// เอาเฉพาะ URL ที่มี original
const candidates = images
  .filter(item => item.original)
  .map(item => item.original);



const blocked = [
  "facebook",
  "fbcdn",
  "fbsbx",
  "tiktok",
  "musical.ly",
  "pinterest",
  "pinimg",
  "twitter",
  "x.com",
  "instagram",
  "youtube",
  "i.ytimg"
];


// ตัดเว็บที่ไม่ต้องการ
const filteredImages = candidates.filter(url => {

  const lower = url.toLowerCase();

  return !blocked.some(domain =>
    lower.includes(domain)
  );

});



// เช็คว่าเปิดรูปได้จริง
const validImages = [];


for (const url of filteredImages) {

  if(validImages.length >= 5){
    break;
  }


  const isValid = await checkImage(url);


  console.log(
    isValid ? "✅ ใช้รูป:" : "❌ รูปเสีย:",
    url
  );


  if(isValid){
    validImages.push(url);
  }

}



console.log("================ IMAGE RESULT ================");
console.log("ทั้งหมดจาก SerpAPI:", images.length);
console.log("ผ่าน filter:", filteredImages.length);
console.log("รูปใช้งานได้:", validImages.length);



res.json({
  images: validImages
});
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.json({
  images:[]
});
  }
});

app.listen(5000, () => {
  console.log("API running http://localhost:5000");
});