import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import prisma from "@/lib/prisma";
import { parseUnits, keccak256, stringToBytes } from "viem";
import { getAgentSmartWallet, publicClient } from "@/blockchain/agentWallet";
import { publishAgentTaskOnchain } from "@/blockchain/agentFunctions";
import { decodeEventLog, hexToBigInt } from "viem";

const USDC_CELO = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const TRANSFER_ABI = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: false, name: "value", type: "uint256" },
        ],
        name: "Transfer",
        type: "event",
    },
] as const;

const thirdwebSecretKey = process.env.THIRDWEB_SECRET_KEY;

if (!thirdwebSecretKey) {
    // Warn but don't crash building
    console.warn("THIRDWEB_SECRET_KEY is not defined");
}

const client = createThirdwebClient({
    secretKey: thirdwebSecretKey || "",
});

let cachedSmartWallet: { address: string } | null = null;

export async function POST(request: Request) {
    try {

        const paymentData =
            request.headers.get("PAYMENT-SIGNATURE") ||
            request.headers.get("X-PAYMENT");

        const body = await request.json();

        // Generate unique Agent Request ID and its hash for on-chain
        const agentRequestId = body.agentRequestId || crypto.randomUUID();
        const formattedRequestId = keccak256(stringToBytes(agentRequestId));

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

        if (!cachedSmartWallet) {
            const { agentSmartWallet } = await getAgentSmartWallet();
            cachedSmartWallet = { address: agentSmartWallet.address };
        }
        const smartAccountAddress = cachedSmartWallet.address;

        const thirdwebFacilitator = facilitator({
            client,
            serverWalletAddress: smartAccountAddress,
        });

        // --- PAYMENT VERIFICATION ---
        let paymentVerified = false;

        // Fallback 1: Manual Transaction Hash Verification (Skill/Agent Flow)
        if (paymentData && paymentData.length === 66 && paymentData.startsWith("0x")) {
            console.log(`🔍 Verifying Manual Transaction Hash: ${paymentData}`);
            try {
                const receipt = await publicClient.getTransactionReceipt({ hash: paymentData as `0x${string}` });

                if (receipt.status === "success") {
                    // Look for USDC Transfer log to smartAccountAddress
                    const transferLogs = receipt.logs.filter((log: any) =>
                        log.address.toLowerCase() === USDC_CELO.toLowerCase()
                    );

                    for (const log of transferLogs) {
                        try {
                            const decoded = decodeEventLog({
                                abi: TRANSFER_ABI,
                                data: log.data,
                                topics: log.topics,
                            });

                            if (
                                decoded.eventName === "Transfer" &&
                                decoded.args.to.toLowerCase() === smartAccountAddress.toLowerCase()
                            ) {
                                const amountPaid = decoded.args.value;
                                const requiredAmount = BigInt(parseUnits(finalPrice.toString(), 6));

                                if (amountPaid >= requiredAmount) {
                                    // Verify hash hasn't been used before
                                    const existingTask = await prisma.task.findFirst({
                                        where: { paymentTxHash: paymentData }
                                    });

                                    if (existingTask) {
                                        console.warn(`⚠️ Transaction hash ${paymentData} already used for Task ${existingTask.id}`);
                                        return Response.json({ error: "Transaction hash already used" }, { status: 400 });
                                    }

                                    console.log("✅ Manual Payment Verified via Hash!");
                                    paymentVerified = true;
                                    break;
                                }
                            }
                        } catch (e) { /* skip non-transfer logs */ }
                    }
                }
            } catch (err) {
                console.error("Manual Hash Verification Error:", err);
            }
        }

        let result: any = { status: 200 };

        if (!paymentVerified) {
            // Verify and process the payment via Thirdweb x402 (Browser/Authorization Flow)
            result = await settlePayment({
                resourceUrl: request.url,
                method: "POST",
                paymentData: paymentData || "",
                payTo: smartAccountAddress,
                network: celo,
                price: { amount: parseUnits(finalPrice.toString(), 6).toString(), asset: { address: USDC_CELO, decimals: 6, symbol: "USDC" } },
                facilitator: thirdwebFacilitator,
                routeConfig: {
                    description: `Agent Feedback Request: ${title || prompt.substring(0, 30)}...`,
                    mimeType: "application/json",
                    maxTimeoutSeconds: 60 * 60 * 24,
                },
            });
        }

        if (result.status !== 200) {
            // Payment required or failed
            let responseBody = (result as any).responseBody || {};

            // If it's a 402 (Payment Required) and Thirdweb didn't provide a body,
            // we'll manually construct a standard x402 response body.
            if (result.status === 402 && !responseBody.payTo) {
                responseBody = {
                    payTo: smartAccountAddress,
                    price: {
                        amount: parseUnits(finalPrice.toString(), 6).toString(),
                        asset: {
                            address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
                            decimals: 6,
                            symbol: "USDC"
                        }
                    },
                    description: `Agent Feedback Request: ${title || prompt.substring(0, 30)}...`
                };
            }

            console.log("Returning x402 Response:", { status: result.status, body: responseBody });

            return Response.json(responseBody, {
                status: result.status,
                headers: result.responseHeaders,
            });
        }

        // 3. Register on-chain via Smart Account
        let onchainHash: string | undefined = undefined;

        try {
            console.log(`⛓️ Registering Task ${agentRequestId} on-chain...`);
            onchainHash = await publishAgentTaskOnchain(
                formattedRequestId,
                finalPrice,
                participants
            );
            console.log(`✅ On-chain Task Created: ${onchainHash}`);
        } catch (onchainError) {
            console.error("On-chain Registration Failed:", onchainError);
            return Response.json({
                error: "Payment successful but on-chain registration failed.",
                details: String(onchainError)
            }, { status: 500 });
        }


        // Payment Successful -> Create Task
        // Map Agent Request to Task Model

        // Determine Subtask Type
        let dbSubtaskType: any = 'TEXT_INPUT'; // Default
        if (feedbackType === 'multiple_choice') dbSubtaskType = 'MULTIPLE_CHOICE';
        if (feedbackType === 'file_upload') dbSubtaskType = 'FILE_UPLOAD';
        if (feedbackType === 'rating') dbSubtaskType = 'RATING';

        // Create the task with restrictions and subtasks
        const task = await prisma.task.create({
            data: {
                title: title || "Agent Feedback Request",
                description: prompt,
                maxParticipants: parseInt(participants),
                baseReward: parseUnits(rewardPerParticipant.toString(), 6).toString(),
                maxBonusReward: "0",
                totalDeposited: parseUnits(finalPrice.toString(), 6).toString(),
                status: 'ACTIVE',
                aiCriteria: JSON.stringify(constraints),
                feedbackType: feedbackType,
                agentRequestId: agentRequestId,
                blockChainId: onchainHash || "0",
                paymentTxHash: (paymentData && paymentData.length === 66) ? paymentData : undefined,

                // Map restrictions from constraints
                restrictionsEnabled: !!(constraints.countryRestriction || constraints.ageRestriction || constraints.genderRestriction),
                countryRestriction: !!constraints.countryRestriction,
                countries: constraints.countries ? JSON.stringify(constraints.countries) : undefined,
                ageRestriction: !!constraints.ageRestriction,
                minAge: constraints.minAge,
                maxAge: constraints.maxAge,
                genderRestriction: !!constraints.genderRestriction,
                gender: constraints.gender,

                // Create subtasks
                subtasks: {
                    create: body.subtasks && Array.isArray(body.subtasks)
                        ? body.subtasks.map((st: any, index: number) => ({
                            title: st.title || prompt,
                            description: st.description || "",
                            type: st.type || dbSubtaskType,
                            required: st.required !== false,
                            order: st.order || index + 1,
                            options: st.options ? JSON.stringify(st.options) : undefined,
                            fileTypes: st.fileTypes ? JSON.stringify(st.fileTypes) : undefined,
                        }))
                        : [{
                            title: prompt,
                            type: dbSubtaskType,
                            required: true,
                            order: 1,
                            options: options ? JSON.stringify(options) : undefined,
                        }]
                }
            }
        });

        // Return internal taskId and the agentRequestId used for external tracking
        return Response.json({
            success: true,
            taskId: task.id,
            agentRequestId: task.agentRequestId, // This is the ID the external agent uses
            status: "active",
            explorerUrl: `https://earnbase.vercel.app/tasks/${task.id}`
        });

    } catch (error) {
        console.error("Agent Submit Error:", error);
        return Response.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
    }
}
