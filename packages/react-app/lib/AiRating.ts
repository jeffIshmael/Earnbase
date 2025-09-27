"use server";
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai"; // Corrected import
import dotenv from "dotenv";
dotenv.config();

interface FeedbackRating {
  rating: number;
  explanation: string;
}

export async function getAiRating(
  userId: string,
  feedback: string,
  bestResponse: string
): Promise<FeedbackRating | null> {
  if (!process.env.GEMINI_API_KEY) {
    throw Error("gemini api not set.");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const MODEL_NAME = "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: `You are an expert evaluator reviewing user feedback.  
  Your role is to assess how valuable and thoughtful the feedback is, while using the provided marking scheme only as a general guide — not as a rigid answer key.  
  
  MARKING SCHEME (for guidance only):  
  ${bestResponse}
  
  EVALUATION CRITERIA:
  - Relevance (40%): Does the feedback meaningfully engage with the topic or ideas suggested in the marking scheme?  
  - Completeness (30%): Does it provide enough detail or perspective, even if expressed differently from the marking scheme?  
  - Clarity & Quality (20%): Is the feedback understandable, well-structured, and easy to follow?  
  - Originality & Insight (10%): Does the feedback add unique ideas, thoughtful perspectives, or new angles?  
  
  RATING SCALE:
  - 9–10: Exceptional — highly thoughtful, relevant, and insightful; exceeds expectations  
  - 7–8: Strong — addresses most aspects with clarity and value  
  - 5–6: Moderate — partly relevant, covers some aspects but has gaps  
  - 3–4: Weak — limited relevance or depth  
  - 1–2: Poor — unclear, irrelevant, or little value  
  
  OUTPUT FORMAT (strict):  
  Return ONLY one line in the format:  
  <number>: <brief explanation>  
  
  Example:  
  8: Thoughtful and mostly relevant feedback, with clear insights though missing a few details.`,
  });

  // Using a descriptive chat description
  const userFeedbackChatSessions = new Map<string, ChatSession>();
  if (!userId) {
    throw new Error("User ID is required.");
  }
  if (!feedback || feedback.trim() === "") {
    throw new Error("Feedback cannot be empty or just whitespace.");
  }

  // Use existing session or create a new one for the user
  let chat = userFeedbackChatSessions.get(userId);
  if (!chat) {
    chat = model.startChat();
    userFeedbackChatSessions.set(userId, chat);
  }

  // Make the prompt more explicit about the desired output format
  const prompt = `USER FEEDBACK: "${feedback}"

Please evaluate the quality and value of this user feedback. Consider factors like relevance, completeness, clarity, and insight. Respond ONLY with the rating (a number 1-10) followed by a colon and then a brief explanation of your rating decision. Example: '8: Comprehensive feedback with clear insights and actionable suggestions.'`;

  try {
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    if (!text) {
      console.warn(
        `Gemini returned an empty response for feedback: "${feedback}"`
      );
      return null;
    }

    const trimmedText = text.trim();
    const parts = trimmedText.split(":", 2);

    if (parts.length === 2) {
      const rating = parseInt(parts[0].trim(), 10);
      const explanation = parts[1].trim();

      if (!isNaN(rating) && rating >= 1 && rating <= 10) {
        return { rating, explanation };
      }
    }

    console.warn(
      `Could not parse Gemini's response into expected format: "${trimmedText}" for feedback: "${feedback}"`
    );
    return null;
  } catch (error: any) {
    console.error(
      `Error getting AI rating for user ${userId} feedback "${feedback}":`,
      error
    );

    // Handle specific Gemini API errors
    if (error.status === 503) {
      console.warn("Gemini API is overloaded, returning default rating");
      return {
        rating: 5,
        explanation:
          "AI service temporarily unavailable, default rating applied",
      };
    }

    // For other errors, return null instead of throwing
    return null;
  }
}

export async function improveCriteria(criteria: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key not set.");
  }

  if (!criteria || criteria.trim().length < 10) {
    throw new Error("Criteria must be at least 10 characters long.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const MODEL_NAME = "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME, // Use the most stable model
    systemInstruction: `You are an expert at writing AI evaluation criteria for task submissions. Your job is to improve and enhance the provided criteria to make them more specific, comprehensive, and effective for AI rating systems.

Your improved criteria should:
- Be more specific and actionable
- Include clear examples of what constitutes high-quality vs low-quality responses
- Cover different aspects like relevance, completeness, clarity, and insight
- Be structured and easy to understand
- Include specific scoring guidelines
- Be comprehensive but concise

Return ONLY the improved criteria text, no additional commentary or formatting.`,
  });

  // Use chat session like your working getAiRating function
  const chat = model.startChat();

  const prompt = `Please improve and enhance this AI evaluation criteria to make it more effective for rating task submissions:

ORIGINAL CRITERIA:
${criteria}

IMPROVED CRITERIA:`;

  try {
    const result = await chat.sendMessage(prompt);
    const improvedCriteria = result.response.text();

    if (!improvedCriteria || improvedCriteria.trim().length === 0) {
      throw new Error("Failed to generate improved criteria - empty response");
    }

    return improvedCriteria.trim();
  } catch (error: any) {
    console.error("Error improving criteria:", error);

    // Handle specific Gemini API errors (same pattern as your getAiRating)
    if (error.status === 503) {
      throw new Error(
        "AI service temporarily unavailable, please try again later"
      );
    }

    if (error.status === 401 || error.status === 403) {
      throw new Error(
        "AI service authentication failed. Please check your GEMINI_API_KEY."
      );
    }

    if (
      error.message?.includes("SAFETY") ||
      error.message?.includes("blocked")
    ) {
      throw new Error(
        "Content was blocked by AI safety filters. Please modify your criteria and try again."
      );
    }

    throw new Error(
      `Failed to improve criteria: ${error.message || "Unknown error"}`
    );
  }
}
