import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

export async function validateAnswer(question: string, answer: string): Promise<{ valid: boolean; reason?: string }> {
    if (!answer || answer.trim().length < 2) {
        return { valid: false, reason: "Answer is too short or empty." };
    }

    const fullPrompt = `
    Task: Validate a user's answer to a task question.
    
    Question: "${question}"
    User Answer: "${answer}"
    
    Validation Criteria:
    1. The answer must be relevant and meaningfully address the question.
    2. The answer must NOT be a direct copy-paste of the question text.
    3. The answer must NOT be a generic, low-effort response like "OK", "yes", "good", "nice", "." etc.
    4. The answer should show genuine effort to respond.

    Respond ONLY in JSON format:
    {
      "valid": boolean,
      "reason": "Clear explanation if invalid, otherwise empty"
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        const responseText = response.text || "";
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const data = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
        
        return {
            valid: !!data.valid,
            reason: data.reason || ""
        };
    } catch (error) {
        console.error("Gemini Validation Error:", error);
        // Fallback to valid to allow user to proceed if AI service fails
        return { valid: true };
    }
}
