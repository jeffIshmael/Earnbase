import { NextRequest, NextResponse } from "next/server";
import { ingestTask } from "@/core/taskIngestion";
import { settleX402Payment, create402Response } from "@/agents/x402/facilitator";
import { calculateCost } from "@/agents/x402/pricing";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const paymentData = request.headers.get("X-PAYMENT") || request.headers.get("PAYMENT-SIGNATURE");

        // Extract task details
        const { maxParticipants, baseReward, maxBonusReward } = body;

        // Calculate expected cost
        const expectedCost = calculateCost(
            maxParticipants,
            (Number(baseReward) + Number(maxBonusReward)).toString()
        );

        const priceUSD = `$${(Number(expectedCost) / 1_000_000).toFixed(2)}`; // Convert USDC to USD

        // If no payment data, return 402 Payment Required
        if (!paymentData) {
            const response402 = create402Response(request.url, priceUSD);
            return NextResponse.json(response402.body, {
                status: response402.status,
                headers: response402.headers,
            });
        }

        // Settle payment using thirdweb
        const settlement = await settleX402Payment(
            request.url,
            "POST",
            paymentData,
            priceUSD
        );

        if (!settlement.success) {
            return NextResponse.json(
                { error: "Payment settlement failed", details: settlement.error },
                { status: 402 }
            );
        }

        // Payment successful, ingest task
        const task = await ingestTask({
            ...body,
            paymentTxHash: settlement.txHash, // Use transaction hash from settlement
        });

        return NextResponse.json(
            {
                success: true,
                taskId: task?.id,
                paymentReceipt: settlement.txHash,
            },
            {
                headers: {
                    "X-Payment-Receipt": settlement.txHash || "",
                },
            }
        );
    } catch (error: any) {
        console.error("Task submission error:", error);
        return NextResponse.json(
            { error: "Task submission failed", message: error.message },
            { status: 500 }
        );
    }
}
