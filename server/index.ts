import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

import googleImageRouter from "./googleImage.ts";

dotenv.config();

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "20mb",
  })
);

/* ============================================
   GOOGLE IMAGE
============================================ */

app.use(
  "/api",
  googleImageRouter
);


/* ============================================
   PLACE IMAGE - SERP API
============================================ */

async function checkImage(url: string) {
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
  } catch {
    return false;
  }
}


app.get(
  "/api/place-image",
  async (req, res) => {
    try {
      const {
        name,
        province,
      } = req.query;

      const query =
        `${name} ${province} Thailand scenic landscape viewpoint travel photography`;

      console.log(
        "===== QUERY ====="
      );

      console.log(query);

      const result =
        await axios.get(
          "https://serpapi.com/search.json",
          {
            params: {
              engine: "google_images",
              q: query,
              num: 20,
              api_key:
                process.env.SERP_API_KEY,
            },
          }
        );

      const images =
        result.data.images_results ||
        [];

      const candidates =
        images
          .filter(
            (item: any) =>
              item.original
          )
          .map(
            (item: any) =>
              item.original
          );

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
        candidates.filter(
          (url: string) => {
            const lower =
              url.toLowerCase();

            return !blocked.some(
              (domain) =>
                lower.includes(domain)
            );
          }
        );

      const validImages: string[] =
        [];

      for (
        const url of filteredImages
      ) {
        if (
          validImages.length >= 5
        ) {
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
        "รูปใช้งานได้:",
        validImages.length
      );

      return res.json({
        images: validImages,
      });

    } catch (err: any) {

      console.error(
        err.response?.data ||
          err.message
      );

      return res.json({
        images: [],
      });
    }
  }
);


/* ============================================
   OKMD AI
============================================ */

const OKMD_BASE_URL =
  "https://gen.ai.kku.ac.th/okmd/api/v1";

const OKMD_MODELS = {
  claude: "claude-sonnet-5",
  gpt: "gpt-5.4",
  gemini: "gemini-3.7-flash",
};


app.post(
  "/api/ai",
  async (req, res) => {

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


      if (
        !model ||
        !OKMD_MODELS[
          model as keyof typeof OKMD_MODELS
        ]
      ) {
        return res.status(400).json({
          error: "Invalid AI model",
          availableModels:
            Object.keys(
              OKMD_MODELS
            ),
        });
      }


      if (!prompt) {
        return res.status(400).json({
          error:
            "Prompt is required",
        });
      }


      if (
        !process.env.OKMD_API_KEY
      ) {
        return res.status(500).json({
          error:
            "OKMD_API_KEY is not configured",
        });
      }


      const modelId =
        OKMD_MODELS[
          model as keyof typeof OKMD_MODELS
        ];


      console.log(
        "📡 ส่งไป OKMD model:",
        modelId
      );


      const start =
        performance.now();


      const response =
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
                `Bearer ${process.env.OKMD_API_KEY}`,
            },

            timeout: 300000,
          }
        );


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


      if (!content) {
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

    } catch (error: any) {

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
        error.response?.status ||
          500
      ).json({
        error:
          error.response?.data ||
          error.message ||
          "OKMD API error",
      });
    }
  }
);


/* ============================================
   START SERVER
============================================ */

const PORT = Number(process.env.PORT) || 5050;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running on port ${PORT}`);
  console.log("🖼️ Google Image API enabled");
  console.log("PID:", process.pid);
});

server.on("error", (error) => {
  console.error("❌ SERVER ERROR:", error);
});

process.on("exit", (code) => {
  console.log("⚠️ PROCESS EXIT:", code);
});

process.on("SIGINT", () => {
  console.log("⚠️ SIGINT received");
});

process.on("SIGTERM", () => {
  console.log("⚠️ SIGTERM received");
});

process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
});