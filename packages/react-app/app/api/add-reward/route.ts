// app/api/add-reward/route.ts
import { NextResponse } from 'next/server';
import { addUserReward } from '@/lib/WriteFunctions'; // server-safe
import { z } from 'zod';

const RewardSchema = z.object({
  userAddress: z.string(),
  amount: z.string(),
});

export async function POST(req: Request) {
  try {
    console.log("received the request.");
    const body = await req.json();
    const { userAddress, amount } = RewardSchema.parse(body);

    const txHash = await addUserReward(amount, userAddress as `0x${string}`);

    if (!txHash) throw new Error("Reward failed");

    return NextResponse.json({ success: true, txHash });
  } catch (err) {
    console.error("Reward error:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
