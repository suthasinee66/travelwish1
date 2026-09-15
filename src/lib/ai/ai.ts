export type AIModel =
    | "claude"
    | "gpt"
    | "gemini";

export async function generateWithSelectedModel(
    selectedModel: AIModel,
    prompt: string
): Promise<string> {

    const response = await fetch(
        "http://localhost:5000/api/ai",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                model: selectedModel,
                prompt
            })
        }
    );

    if (!response.ok) {

        const error =
            await response.text();

        console.error(
            "AI Server Error:",
            error
        );

        throw new Error(
            "AI server error"
        );
    }

    const data =
        await response.json();

    if (!data.content) {
        throw new Error(
            "AI returned empty response"
        );
    }

    return data.content;
}