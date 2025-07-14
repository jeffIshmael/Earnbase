// app/api/add-reward/route.ts
import { NextResponse } from 'next/server';
import { addUserSmartAccount } from '@/lib/WriteFunctions'; // server-safe
import { z } from 'zod';

const RewardSchema = z.object({
  userAddress: z.string(),
  smartAddress: z.string(),
});

export async function POST(req: Request) {
  try {
    console.log("received the request.");
    const body = await req.json();
    const { userAddress, smartAddress } = RewardSchema.parse(body);

    const txHash = await addUserSmartAccount(smartAddress as `0x${string}`, userAddress as `0x${string}`);

    if (!txHash) throw new Error("Failed to add.");

    return NextResponse.json({ success: true, txHash });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
