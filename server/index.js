import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({
  limit: "20mb"
}));

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


// ============================================
// OKMD AI
// ============================================

const OKMD_BASE_URL =
  "https://gen.ai.kku.ac.th/okmd/api/v1";

const OKMD_MODELS = {
  claude: "claude-sonnet-5",
  gpt: "gpt-5.4",
  gemini: "gemini-3.7-flash",
};


app.post("/api/ai", async (req, res) => {

  try {

    const {
      model,
      prompt,
    } = req.body;

    console.log("====================================");
    console.log("🤖 OKMD AI REQUEST");
    console.log("Model:", model);
    console.log("Prompt Length:", prompt?.length);
    console.log("====================================");

    // ตรวจสอบ model
    if (!model || !OKMD_MODELS[model]) {

      return res.status(400).json({
        error: "Invalid AI model",
        availableModels: Object.keys(OKMD_MODELS),
      });

    }

    // ตรวจสอบ prompt
    if (!prompt) {

      return res.status(400).json({
        error: "Prompt is required",
      });

    }

    // ตรวจ API Key
    if (!process.env.OKMD_API_KEY) {

      console.error(
        "❌ OKMD_API_KEY ไม่มีใน server/.env"
      );

      return res.status(500).json({
        error: "OKMD_API_KEY is not configured",
      });

    }

    const modelId =
      OKMD_MODELS[model];

    console.log(
      "📡 ส่งไป OKMD model:",
      modelId
    );

    const start = performance.now();

    const response = await axios.post(
      `${OKMD_BASE_URL}/chat/completions`,
      {
        model: modelId,

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.2,

        max_tokens: 12000,
      },
      {
        headers: {
          "Content-Type": "application/json",

          Authorization:
            `Bearer ${process.env.OKMD_API_KEY}`,
        },

        timeout:  300000,
      }
    );

    const end = performance.now();

    const data = response.data;

    const content =
      data?.choices?.[0]?.message?.content;

    console.log(
      `✅ OKMD ตอบกลับใน ${(
        (end - start) /
        1000
      ).toFixed(2)} วินาที`
    );

    console.log(
      "Model:",
      data?.model
    );

    console.log(
      "Response Length:",
      content?.length
    );

    console.log(
      "Usage:",
      data?.usage
    );

    console.log("====================================");

    if (!content) {

      console.error(
        "❌ OKMD ไม่มี content"
      );

      return res.status(500).json({
        error: "OKMD returned empty response",
        raw: data,
      });

    }

    return res.json({

      content,

      model: data?.model,

      usage: data?.usage,

      model_quota:
        data?.model_quota,

    });

  } catch (error) {

    console.error(
      "❌ OKMD ERROR"
    );

    console.error(
      "Status:",
      error.response?.status
    );

    console.error(
      "Data:",
      error.response?.data
    );

    console.error(
      "Message:",
      error.message
    );

    return res.status(
      error.response?.status || 500
    ).json({

      error:
        error.response?.data ||
        error.message ||
        "OKMD API error",

    });

  }

});

app.listen(5000, () => {
  console.log("API running http://localhost:5000");
});