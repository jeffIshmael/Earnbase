"use server"
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai"; // Corrected import
import dotenv from "dotenv";
dotenv.config();




interface FeedbackRating {
  rating: number;
  explanation: string;
}

export async function getAiRating(userId: string, feedback: string): Promise<FeedbackRating | null> {

if(!process.env.GEMINI_API_KEY){
  throw Error('gemini api not set.')
}
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-1.5-flash"; 
const model = genAI.getGenerativeModel({ 
  model: MODEL_NAME,
  systemInstruction: "You are an app founder reviewing user feedback during a beta test. Rate the feedback from 1 to 10 based on usefulness, clarity, and constructiveness. Only respond with the rating and a short explanation. The rating should be a number, followed by a colon and then the explanation. For example: '8: Great suggestion for new feature.'",
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
  const prompt = `Feedback: "${feedback}"\nPlease rate this feedback from 1 to 10 based on usefulness, clarity, and constructiveness. Respond ONLY with the rating (a number) followed by a colon and then a short explanation. Example: '8: Great suggestion for new feature.'`;
  
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