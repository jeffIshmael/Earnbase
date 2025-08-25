"use server"
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai"; // Corrected import
import dotenv from "dotenv";
dotenv.config();


interface FeedbackRating {
  rating: number;
  explanation: string;
}

export async function getAiRating(userId: string, feedback: string, bestResponse: string ): Promise<FeedbackRating | null> {

if(!process.env.GEMINI_API_KEY){
  throw Error('gemini api not set.')
}
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-1.5-flash"; 
const model = genAI.getGenerativeModel({ 
  model: MODEL_NAME,
  systemInstruction: `You are an expert evaluator reviewing user feedback against a specific marking scheme. Your role is to assess how well the user's feedback aligns with the expected best response criteria.

MARKING SCHEME:
${bestResponse}

EVALUATION CRITERIA:
- Relevance to the marking scheme (40%): How closely does the feedback address the key points from the best response?
- Completeness (30%): Does the feedback cover all important aspects mentioned in the marking scheme?
- Quality and clarity (20%): Is the feedback well-articulated and easy to understand?
- Originality and insight (10%): Does the feedback provide unique perspectives or valuable additions?

RATING SCALE:
- 9-10: Exceptional alignment with marking scheme, exceeds expectations
- 7-8: Strong alignment, covers most key points well
- 5-6: Moderate alignment, addresses some key points
- 3-4: Weak alignment, misses many key points
- 1-2: Poor alignment, significantly off-target

RESPONSE FORMAT:
Respond ONLY with the rating (a number 1-10) followed by a colon and then a brief explanation of how the feedback aligns with the marking scheme. Example: '8: Strong alignment with marking scheme, covers key points well with clear insights.'`,
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
      console.warn(`Gemini returned an empty response for feedback: "${feedback}"`);
      return null;
    }

    const trimmedText = text.trim();
    const parts = trimmedText.split(':', 2); // Split only on the first colon

    if (parts.length === 2) {
      const rating = parseInt(parts[0].trim(), 10);
      const explanation = parts[1].trim();

      if (!isNaN(rating) && rating >= 1 && rating <= 10) {
        return { rating, explanation };
      }
    }
    
    // Fallback if parsing fails or rating is out of bounds
    console.warn(`Could not parse Gemini's response into expected format: "${trimmedText}" for feedback: "${feedback}"`);
    return null;

  } catch (error) {
    console.error(`Error getting AI rating for user ${userId} feedback "${feedback}":`, error);
    // Propagate the error or return a specific error structure depending on your error handling strategy
    throw new Error("Failed to get AI rating due to an internal error.");
  }
}