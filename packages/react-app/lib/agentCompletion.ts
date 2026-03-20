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

        // 1. First aggregate and pin results to ensure we have data before marking as completed
        const ipfsCid = await aggregateAndPinResults(taskId);
        if (!ipfsCid) {
            console.warn(`No IPFS CID generated for task ${taskId}. Aborting finalization.`);
            return { success: false, error: "No submissions to aggregate" };
        }
        console.log(`Pinned IPFS CID: ${ipfsCid}`);

        // 2. Mark task as completing in DB
        await prisma.task.update({
            where: { id: taskId },
            data: {
                status: "COMPLETED",
                completed: true,
                claimed: true,
                ipfsHash: ipfsCid // Double check pinning also updates this, but good to be explicit
            }
        });

        // Convert string ID to bytes32, hash the IPFS CID for storage
        let formattedRequestId: `0x${string}`;
        if (task.agentRequestId.startsWith('0x') && task.agentRequestId.length === 64) {
            formattedRequestId = task.agentRequestId as `0x${string}`;
        } else {
            formattedRequestId = keccak256(stringToBytes(task.agentRequestId));
        }

        const resultsCID = ipfsCid;
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
        // Ensure all completion flags are reset
        await prisma.task.update({
            where: { id: taskId },
            data: {
                status: "ACTIVE",
                completed: false,
                claimed: false
            }
        }).catch(e => console.error("Failed to revert task status:", e));
        throw error;
    }
}
