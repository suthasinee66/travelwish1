import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

console.log("====================================");
console.log("🧪 TEST OKMD");
console.log(
  "🔑 API KEY:",
  process.env.OKMD_API_KEY
    ? `configured (${process.env.OKMD_API_KEY.length} chars)`
    : "MISSING"
);
console.log("====================================");

try {
  const response = await axios.post(
    "https://gen.ai.kku.ac.th/okmd/api/v1/chat/completions",
    {
      model: "gemini-3.7-flash",

      messages: [
        {
          role: "user",
          content: "ตอบคำว่า OK เท่านั้น",
        },
      ],

      temperature: 0.2,
      max_tokens: 100,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OKMD_API_KEY}`,
      },

      timeout: 60000,
    }
  );

  console.log("========== SUCCESS ==========");
  console.dir(response.data, { depth: null });
  console.log("==============================");

} catch (error) {

  console.log("========== ERROR ==========");

  console.log(
    "STATUS:",
    error.response?.status
  );

  console.log(
    "RESPONSE:"
  );

  console.dir(
    error.response?.data,
    { depth: null }
  );

  console.log(
    "MESSAGE:",
    error.message
  );

  console.log("===========================");
}