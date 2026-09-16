import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import OpenAI from "openai";

dotenv.config();

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());

app.use(
  express.json({
    limit: "20mb",
  })
);

// ============================================
// OKMD API KEYS
// ============================================

const OKMD_API_KEYS = [
  process.env.OKMD_API_KEY_1,
  process.env.OKMD_API_KEY_2,
].filter(Boolean);

let currentOKMDKeyIndex = 0;

function getOKMDKey() {
  if (OKMD_API_KEYS.length === 0) {
    return null;
  }

  return OKMD_API_KEYS[currentOKMDKeyIndex];
}

function switchOKMDKey() {
  if (OKMD_API_KEYS.length <= 1) {
    return;
  }

  currentOKMDKeyIndex =
    (currentOKMDKeyIndex + 1) % OKMD_API_KEYS.length;

  console.log(
    `🔄 เปลี่ยนเป็น OKMD API Key ${currentOKMDKeyIndex + 1}`
  );
}

// ============================================
// PLACE IMAGE - SERP API
// ============================================

async function checkImage(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      responseType: "stream",
    });

    const contentType =
      response.headers["content-type"];

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

    const query =
      `${name} ${province} Thailand scenic landscape viewpoint travel photography`;

    console.log("===== QUERY =====");
    console.log(query);

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

    const images =
      result.data.images_results || [];

    const candidates = images
      .filter((item) => item.original)
      .map((item) => item.original);

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
      "i.ytimg",
    ];

    const filteredImages =
      candidates.filter((url) => {
        const lower = url.toLowerCase();

        return !blocked.some((domain) =>
          lower.includes(domain)
        );
      });

    const validImages = [];

    for (const url of filteredImages) {
      if (validImages.length >= 5) {
        break;
      }

      const isValid =
        await checkImage(url);

      console.log(
        isValid
          ? "✅ ใช้รูป:"
          : "❌ รูปเสีย:",
        url
      );

      if (isValid) {
        validImages.push(url);
      }
    }

    console.log(
      "================ IMAGE RESULT ================"
    );

    console.log(
      "ทั้งหมดจาก SerpAPI:",
      images.length
    );

    console.log(
      "ผ่าน filter:",
      filteredImages.length
    );

    console.log(
      "รูปใช้งานได้:",
      validImages.length
    );

    return res.json({
      images: validImages,
    });

  } catch (err) {
    console.error(
      err.response?.data ||
      err.message
    );

    return res.json({
      images: [],
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

    console.log(
      "===================================="
    );

    console.log(
      "🤖 OKMD AI REQUEST"
    );

    console.log(
      "Model:",
      model
    );

    console.log(
      "Prompt Length:",
      prompt?.length
    );

    console.log(
      "===================================="
    );

    // ตรวจสอบ Model
    if (
      !model ||
      !OKMD_MODELS[model]
    ) {
      return res.status(400).json({
        error: "Invalid AI model",
        availableModels:
          Object.keys(OKMD_MODELS),
      });
    }

    // ตรวจสอบ Prompt
    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    // ตรวจสอบ API Keys
    if (OKMD_API_KEYS.length === 0) {
      console.error(
        "❌ ไม่มี OKMD API Key"
      );

      return res.status(500).json({
        error:
          "OKMD API keys are not configured",
      });
    }

    const modelId =
      OKMD_MODELS[model];

    console.log(
      "📡 ส่งไป OKMD model:",
      modelId
    );

    const start =
      performance.now();

    let response = null;

    // ========================================
    // ลอง API KEY ทั้งหมด
    // ========================================

    for (
      let attempt = 0;
      attempt < OKMD_API_KEYS.length;
      attempt++
    ) {

      const apiKey =
        getOKMDKey();

      console.log(
        `🔑 ใช้ OKMD API Key ${
          currentOKMDKeyIndex + 1
        }`
      );

      try {

        response =
          await axios.post(
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
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${apiKey}`,
              },

              timeout: 300000,
            }
          );

        // สำเร็จ
        break;

      } catch (error) {

        const status =
          error.response?.status;

        console.error(
          `❌ OKMD Key ${
            currentOKMDKeyIndex + 1
          } ERROR:`,
          status
        );

        console.error(
          "Data:",
          error.response?.data
        );

        // ถ้า Key มีปัญหา
        if (
          status === 401 ||
          status === 403 ||
          status === 429
        ) {

          console.log(
            `⚠️ Key ${
              currentOKMDKeyIndex + 1
            } ใช้งานไม่ได้`
          );

          switchOKMDKey();

          continue;
        }

        // Error อื่น
        throw error;
      }
    }

    // ไม่มี Key ไหนใช้งานได้
    if (!response) {

      return res.status(503).json({
        error:
          "All OKMD API keys failed",
      });

    }

    const end =
      performance.now();

    const data =
      response.data;

    const content =
      data?.choices?.[0]
        ?.message?.content;

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

    console.log(
      "===================================="
    );

    if (!content) {

      console.error(
        "❌ OKMD ไม่มี content"
      );

      return res.status(500).json({
        error:
          "OKMD returned empty response",
        raw: data,
      });
    }

    return res.json({
      content,

      model:
        data?.model,

      usage:
        data?.usage,

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

// ============================================
// START SERVER
// ============================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🚀 API running on port ${PORT}`
    );

    console.log(
      `🔑 OKMD Keys configured: ${
        OKMD_API_KEYS.length
      }`
    );

    console.log(
      "🖼️ Place Image API enabled"
    );
  }
);