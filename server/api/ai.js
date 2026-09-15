import OpenAI from "openai";

const okmdAI = new OpenAI({
    baseURL: "https://gen.ai.kku.ac.th/okmd/api/v1",
    apiKey: process.env.OKMD_API_KEY,
});


export async function generateWithSelectedModel(
    model,
    prompt
) {

    console.log("🤖 SELECTED MODEL:", model);

    const modelMap = {
    gemini: "gemini-3.7-flash",
    gpt: "gpt-5.4",
    claude: "claude-sonnet-5",
};

    const selectedModel = modelMap[model];

    console.log(
        "🤖 OKMD MODEL:",
        selectedModel
    );

    if (!selectedModel) {
        throw new Error(
            `Unknown AI model: ${model}`
        );
    }

    const response =
        await okmdAI.chat.completions.create({

            model: selectedModel,

            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful travel planning assistant. Return valid JSON only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],

            temperature: 0.2,

            response_format: {
                type: "json_object"
            }

        });

    const content =
        response.choices[0]?.message?.content;

    console.log(
        "✅ OKMD RESPONSE:",
        content
    );

    return content ?? "";
}