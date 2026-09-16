import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function test() {
  try {
    console.log("====================================");
    console.log("🧪 TEST OPENROUTER");
    console.log(
      "🔑 API KEY:",
      process.env.OPENROUTER_API_KEY
        ? "configured"
        : "missing"
    );
    console.log("====================================");

    const response =
      await client.chat.completions.create({
        model: "google/gemini-3.7-flash",

        messages: [
          {
            role: "user",
            content:
              "แนะนำสถานที่ท่องเที่ยวเชียงใหม่ 3 แห่ง ตอบเป็นภาษาไทย",
          },
        ],
      });

    console.log("✅ OPENROUTER SUCCESS");
    console.log("Model:", response.model);

    console.log("Response:");
    console.log(
      response.choices?.[0]?.message?.content
    );

    console.log("Usage:");
    console.log(response.usage);

  } catch (error) {
    console.error("❌ OPENROUTER ERROR");

    console.error("Status:", error.status);
    console.error("Message:", error.message);

    console.error(
      "Response:",
      error.response?.data
    );
  }
}

test();