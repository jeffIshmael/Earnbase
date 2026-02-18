import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import prisma from "@/lib/prisma";
import { parseUnits } from "viem";

const thirdwebSecretKey = process.env.THIRDWEB_SECRET_KEY;
const ADMIN_WALLET = process.env.EARNBASE_AGENT_WALLET_ADDRESS || "0x4821ced48Fb4456055c86E42587f61c1F39c6315"; // Fallback or env

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
        // ERC-8004 Agent Verification
        const agentType = request.headers.get('X-Agent-Type');
        if (agentType !== 'ERC8004') {
            return Response.json({
                error: "Unauthorized: Only certified ERC-8004 agents can submit to this endpoint."
            }, { status: 403 });
        }

        const paymentData =
            request.headers.get("PAYMENT-SIGNATURE") ||
            request.headers.get("X-PAYMENT");

        if (!paymentData) {
            return Response.json({ error: "Payment signature required" }, { status: 402 });
        }

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
            price: { amount: parseUnits(finalPrice.toString(), 6).toString(), asset: { address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6, symbol: "USDC" } }, // USDC on Celo
            facilitator: thirdwebFacilitator,
            routeConfig: {
                description: `Agent Feedback Request: ${title || prompt.substring(0, 30)}...`,
                mimeType: "application/json",
                maxTimeoutSeconds: 60 * 60 * 24,
            },
        });

        if (result.status !== 200) {
            // Payment required or failed
            console.error("Agent Request Settlement Failed:", {
                status: result.status,
                error: (result as any).responseBody?.error,
                errorMessage: (result as any).responseBody?.errorMessage
            });
            return Response.json((result as any).responseBody || {}, {
                status: result.status,
                headers: result.responseHeaders,
            });
        }

        // Payment Successful -> Create Task
        // Map Agent Request to Task Model

        // Determine Subtask Type
        let dbSubtaskType: any = 'TEXT_INPUT'; // Default
        if (feedbackType === 'multiple_choice') dbSubtaskType = 'MULTIPLE_CHOICE';
        if (feedbackType === 'file_upload') dbSubtaskType = 'FILE_UPLOAD';
        if (feedbackType === 'rating') dbSubtaskType = 'RATING';

        // earnbase agent is the one to create

        const task = await prisma.task.create({
            data: {
                title: title || "Agent Feedback Request",
                description: prompt,
                maxParticipants: parseInt(participants),
                baseReward: parseUnits(rewardPerParticipant.toString(), 6).toString(), // Store as Wei/BigInt string
                maxBonusReward: "0",
                totalDeposited: parseUnits(finalPrice.toString(), 6).toString(),
                status: 'ACTIVE',
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
