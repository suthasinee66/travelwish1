import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

export async function generateTripPlan(prompt: string) {
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(`
You are a travel planner AI.

User request:
${prompt}

Return ONLY JSON:
{
  "title": "",
  "days": [
    {
      "day": 1,
      "plan": [
        {
          "time": "",
          "place": "",
          "activity": "",
          "note": ""
        }
      ]
    }
  ]
}
`);

  const text = result.response.text();

console.log(text);

const cleaned = text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

return JSON.parse(cleaned);
}