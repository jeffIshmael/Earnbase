/**
 * Test script for x402 payment flow using thirdweb SDK
 * 
 * This demonstrates how external agents should submit tasks using
 * thirdweb's official x402 implementation for gasless payments.
 */

import { createThirdwebClient } from "thirdweb";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { privateKeyToAccount } from "thirdweb/wallets";
import { celo } from "thirdweb/chains";
import * as dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:3000";
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || "";
const THIRDWEB_CLIENT_ID = process.env.THIRDWEB_CLIENT_ID || "";

async function main() {
    console.log("🤖 Testing x402 Payment Flow with thirdweb SDK...\\n");

    if (!AGENT_PRIVATE_KEY || !THIRDWEB_CLIENT_ID) {
        console.error("❌ Missing required environment variables:");
        console.error("- AGENT_PRIVATE_KEY");
        console.error("- THIRDWEB_CLIENT_ID");
        process.exit(1);
    }

    // 1. Initialize thirdweb client
    const client = createThirdwebClient({
        clientId: THIRDWEB_CLIENT_ID
    });

    // 2. Create agent account
    const account = privateKeyToAccount({
        client,
        privateKey: AGENT_PRIVATE_KEY as `0x${string}`
    });

    console.log(`Agent Address: ${account.address}`);

    // 3. Wrap fetch with automatic payment handling
    const fetchWithPayment = wrapFetchWithPayment({
        client,
        account,
        paymentOptions: {
            maxValue: "10000000", // Max 10 USDC (in base units)
        },
    });

    // 4. Create task payload
    const taskPayload = {
        agentAddress: account.address,
        title: "Test Task - thirdweb x402",
        description: "This task was submitted using thirdweb's x402 SDK!",
        maxParticipants: 5,
        baseReward: "0.80", // 0.80 USDC per participant
        maxBonusReward: "0.10", // 0.10 USDC bonus
        aiCriteria: "High quality responses required",
        subtasks: [
            {
                title: "What is your favorite programming language?",
                type: "TEXT_INPUT",
                required: true,
            },
            {
                title: "Why do you prefer it?",
                type: "TEXT_INPUT",
                required: true,
            },
        ],
    };

    // 5. Submit task with automatic payment
    console.log("\\n📤 Submitting task to API...");
    console.log("(thirdweb will automatically handle payment if required)\\n");

    try {
        const response = await fetchWithPayment(`${API_URL}/api/agent/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(taskPayload),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Success! Task created:");
            console.log("- Task ID:", data.taskId);
            console.log("- Payment Receipt:", data.paymentReceipt);
            console.log("\\n🎉 Payment was handled automatically by thirdweb!");
            console.log("   (You didn't need to manually sign permits or handle gas)");
        } else {
            const errorData = await response.json();
            console.error("❌ Failed with status:", response.status);
            console.error("Error:", errorData);
        }
    } catch (error: any) {
        console.error("❌ Request failed:", error.message);
        console.error(error);
    }
}

main()
    .then(() => {
        console.log("\\n✨ Test complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\\n❌ Test failed:", error);
        process.exit(1);
    });
