// /app/api/register-user/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { rewardingUser } from "@/lib/Helper/registerUser";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (req.headers.get("authorization") !== `Bearer ${process.env.CHAMAPAY_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const registered = await rewardingUser(address);
    return NextResponse.json({ success: registered }, { status: 200 });
  } catch (e) {
    console.error("Registering error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
