import { aggregateAndPinResults } from "@/lib/ipfs";
import prisma from "@/lib/prisma";
import { completeAgentTaskOnchain } from "@/blockchain/agentFunctions";
import { keccak256, stringToBytes, pad } from "viem";

/**
 * Triggered when a task hits its participant limit or is manually closed.
 * Aggregates results, pins to IPFS, and submits the final on-chain transaction.
 */
export async function finalizeAgentTask(taskId: number) {
    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!task) throw new Error("Task not found");
        if (!task.agentRequestId) throw new Error("Task is not an agent request");
        if (task.status === "COMPLETED") throw new Error("Task already completed");

        // 1. Mark task as completing in DB to prevent duplicate triggers
        await prisma.task.update({
            where: { id: taskId },
            data: { status: "COMPLETED" }
        });

        // 2. Aggregate submissions and pin to IPFS
        const ipfsCid = await aggregateAndPinResults(taskId);
        console.log(`Pinned IPFS CID: ${ipfsCid}`);

        // If no .env is setup for blockchain yet, return early
        if (!process.env.ADMIN_PRIVATE_KEY) {
            console.warn("No ADMIN_PRIVATE_KEY found. Skipping on-chain completion.");
            return { success: true, ipfsCid, txHash: null };
        }

        // Convert string ID to bytes32, hash the IPFS CID for storage
        // using a simple keccak256 or string-to-bytes32 logic based on how the contract expects it
        let formattedRequestId: `0x${string}`;
        if (task.agentRequestId.startsWith('0x') && task.agentRequestId.length === 66) {
            formattedRequestId = task.agentRequestId as `0x${string}`;
        } else {
            // Just pad or hash the uuid string to fit bytes32
            formattedRequestId = keccak256(stringToBytes(task.agentRequestId));
        }

        // resultsCID: The exact string CID directly from IPFS pinning
        const resultsCID = ipfsCid;

        // We send a dummy merkle root for now, as this involves payout logic
        const dummyMerkleRoot = pad('0x0', { size: 32 });

        const hash = await completeAgentTaskOnchain(
            formattedRequestId,
            resultsCID,
            dummyMerkleRoot
        );

        console.log(`Task finalized successfully on-chain! Transaction Hash: ${hash}`);

        return {
            success: true,
            ipfsCid,
            txHash: hash
        };

    } catch (error) {
        console.error("Error finalizing agent task:", error);
        // If it failed, revert the database status so it can be re-attempted
        await prisma.task.update({
            where: { id: taskId },
            data: { status: "ACTIVE" }
        }).catch(e => console.error("Failed to revert task status:", e));
        throw error;
    }
}
