"use server";

import { payTaskerOnchain } from "@/blockchain/agentFunctions";
import { keccak256, stringToBytes } from "viem";

/**
 * Server action to handle on-chain tasker payouts.
 * This is called from the FormGenerator after a task is submitted and rated by AI.
 */
export async function payoutTaskerAction(
    agentRequestId: string,
    contributorAddress: string,
    amount: string,
    reputationWeight: number
) {
    try {
        if (!agentRequestId) {
            throw new Error("Missing agentRequestId for payout");
        }

        // Hash the agentRequestId to get the formattedRequestId used on-chain
        const formattedRequestId = keccak256(stringToBytes(agentRequestId));

        console.log(`Processing on-chain payout for task ${agentRequestId} to ${contributorAddress}`);

        const txHash = await payTaskerOnchain(
            formattedRequestId,
            contributorAddress as `0x${string}`,
            amount,
            reputationWeight
        );

        console.log(`✅ Tasker payout successful: ${txHash}`);
        return { success: true, txHash };
    } catch (error: any) {
        console.error("Payout Action Error:", error);
        return { success: false, error: error.message || "On-chain payout failed" };
    }
}
