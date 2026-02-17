import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import prisma from "@/lib/prisma";
// import { TaskStatus, SubtaskType } from "@prisma/client";
import { parseUnits } from "viem";

const thirdwebSecretKey = process.env.THIRDWEB_SECRET_KEY;
const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS || "0x79fd2035F482937A9d94943E4E8092B0053E5b66"; // Fallback or env

if (!thirdwebSecretKey) {
    // Warn but don't crash building
    console.warn("THIRDWEB_SECRET_KEY is not defined");
}

const client = createThirdwebClient({
    secretKey: thirdwebSecretKey || "",
});

const thirdwebFacilitator = facilitator({
    client,
    serverWalletAddress: ADMIN_WALLET,
});

export async function POST(request: Request) {
    try {
        const paymentData =
            request.headers.get("PAYMENT-SIGNATURE") ||
            request.headers.get("X-PAYMENT");

        const body = await request.json();

        // Basic Schema Validation (Extract necessary fields)
        // TODO: Use full AJV/Zod validation against feedbackRequest.schema.json
        const { feedbackType, prompt, constraints, options, title } = body;

        if (!feedbackType || !prompt || !constraints) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        const participants = constraints.participants || 1;
        const rewardPerParticipant = constraints.rewardPerParticipant || "0";

        // Calculate total price: participants * reward
        // Note: We need to handle decimals. Assuming reward is in USDC (6 decimals) string or simple number.
        // For x402 price, we can pass a string like "$0.10" or exact amount. 
        // Let's assume rewardPerParticipant is in USDC units (e.g. "1.5" USDC).
        const totalAmount = Number(participants) * Number(rewardPerParticipant);
        const platformFee = totalAmount * 0.01; // 1% fee
        const finalPrice = Math.max(totalAmount + platformFee, 0.000001).toFixed(6); // Prevent 0

        // Only enforce payment if not in dev/test skip mode
        // Verify and process the payment via x402
        /* 
           Note: settlePayment will return a 402 response if paymentData is missing or invalid.
           It handles the "Payment Required" flow automatically.
        */
        const result = await settlePayment({
            resourceUrl: request.url,
            method: "POST",
            paymentData,
            payTo: ADMIN_WALLET,
            network: celo,
            price: { amount: finalPrice.toString(), asset: { address: "0xcebA9300f2b948710d2653dD7B07f33c8B655d7f", decimals: 6, symbol: "USDC" } }, // USDC on Celo
            facilitator: thirdwebFacilitator,
            routeConfig: {
                description: `Agent Feedback Request: ${title || prompt.substring(0, 30)}...`,
                mimeType: "application/json",
                maxTimeoutSeconds: 60 * 60 * 24,
            },
        });

        if (result.status !== 200) {
            // Payment required or failed
            return Response.json(result.responseBody, {
                status: result.status,
                headers: result.responseHeaders,
            });
        }

        // Payment Successful -> Create Task
        // Map Agent Request to Task Model

        // Determine Subtask Type
        let dbSubtaskType = SubtaskType.TEXT_INPUT; // Default
        if (feedbackType === 'multiple_choice') dbSubtaskType = SubtaskType.MULTIPLE_CHOICE;
        if (feedbackType === 'file_upload') dbSubtaskType = SubtaskType.FILE_UPLOAD;
        if (feedbackType === 'rating') dbSubtaskType = SubtaskType.RATING;

        // earnbase agent is the one to create

        const task = await prisma.task.create({
            data: {
                title: title || "Agent Feedback Request",
                description: prompt,
                maxParticipants: parseInt(participants),
                baseReward: parseUnits(rewardPerParticipant.toString(), 6).toString(), // Store as Wei/BigInt string
                maxBonusReward: "0",
                totalDeposited: parseUnits(finalPrice.toString(), 6).toString(),
                status: TaskStatus.ACTIVE,
                aiCriteria: JSON.stringify(constraints),
                feedbackType: feedbackType,
                agentRequestId: body.requestId || crypto.randomUUID(), // Use provided ID or generate new

                // Agent tasks have no specific user creator in this model (managed by admin/agent wallet)
                // Creator fields are optional now

                // Create the single subtask for this feedback
                subtasks: {
                    create: {
                        title: prompt,
                        type: dbSubtaskType,
                        required: true,
                        order: 1,
                        options: options ? JSON.stringify(options) : undefined,
                    }
                }
            }
        });

        return Response.json({
            success: true,
            taskId: task.id,
            agentRequestId: task.agentRequestId,
            status: "active",
            explorerUrl: `https://earnbase.vercel.app/tasks/${task.id}`
        });

    } catch (error) {
        console.error("Agent Submit Error:", error);
        return Response.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
    }
}
