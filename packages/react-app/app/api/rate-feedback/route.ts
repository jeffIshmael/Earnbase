import { NextResponse } from "next/server";
import { getAiRating } from "@/lib/AiRating";

export async function POST(req: Request) {
  try {
    console.log("received the request.");
    const { userId, feedback } = await req.json();

    if (!userId || !feedback) {
      return NextResponse.json({ error: "Missing userId or feedback" }, { status: 400 });
    }

    const result = await getAiRating(userId, feedback);

    if (!result) {
      return NextResponse.json({ error: "Could not rate feedback" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
