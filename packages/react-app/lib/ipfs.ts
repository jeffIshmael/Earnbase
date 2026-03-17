"use server";

import { PinataSDK } from "pinata";
import prisma from "@/lib/prisma";

// Initialize Pinata client
// Ensure PINATA_JWT and PINATA_GATEWAY are in .env
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT || "",
    pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

/**
 * Uploads a single file to IPFS via Pinata (Server Side).
 * Returns the IPFS hash (CID).
 */
export async function uploadFileToIpfs(formData: FormData): Promise<string> {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("No file provided in FormData");
        }

        console.log(`Uploading file ${file.name} to IPFS via Server Action...`);
        const upload: any = await pinata.upload.public.file(file);
        const returnCid = upload.IpfsHash || upload.cid;
        console.log(`Successfully uploaded file to IPFS. CID: ${returnCid}`);
        return returnCid;
    } catch (error) {
        console.error("Error uploading file to IPFS on server:", error);
        throw error;
    }
}

/**
 * Aggregates all submissions for a task and pins the JSON result to IPFS.
 * Returns the IPFS hash (CID).
 */
export async function aggregateAndPinResults(taskId: number): Promise<string> {
    try {
        // Fetch the task and all approved submissions
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                submissions: {
                    where: {
                        status: { in: ['APPROVED', 'REWARDED'] } // Only aggregate valid submissions
                    },
                    include: {
                        responses: {
                            include: {
                                subtask: true
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                walletAddress: true,
                                userName: true
                            }
                        }
                    }
                }
            }
        });

        if (!task) {
            throw new Error(`Task with ID ${taskId} not found`);
        }

        if (task.submissions.length === 0) {
            console.warn(`No approved submissions found for task ${taskId}`);
            return ""; // No data to pin
        }

        // Format the data for the agent
        const resultData = {
            taskId: task.id,
            agentRequestId: task.agentRequestId,
            title: task.title,
            description: task.description,
            totalParticipants: task.currentParticipants,
            completedAt: new Date().toISOString(),
            results: task.submissions.map(sub => {
                const mappedResponses: Record<string, string> = {};

                // Map subtask title to the user's response
                sub.responses.forEach(resp => {
                    // If the response is a JSON string (e.g. array of choices), try to parse it safely
                    let parsedValue = resp.response;
                    try {
                        parsedValue = JSON.parse(resp.response);
                    } catch (e) {
                        // It's just a raw string, leave it
                    }
                    mappedResponses[resp.subtask.title] = parsedValue as any;

                    if (resp.fileUrl) {
                        mappedResponses[`${resp.subtask.title}_file`] = resp.fileUrl;
                    }
                });

                return {
                    participantId: sub.user.id,
                    participantAddress: sub.user.walletAddress,
                    submittedAt: sub.submittedAt.toISOString(),
                    aiRating: sub.aiRating,
                    responses: mappedResponses
                };
            })
        };

        // Upload JSON to IPFS via Pinata
        console.log(`Pinning results for Task ${taskId} to IPFS...`);

        // Convert JSON to File for Pinata v3 SDK
        const blob = new Blob([JSON.stringify(resultData)], { type: "application/json" });
        const file = new File([blob], `task_${taskId}_results.json`, { type: "application/json" });

        const upload: any = await pinata.upload.public.file(file);

        const returnCid = upload.IpfsHash || upload.cid;

        console.log(`Successfully pinned Task ${taskId} results. CID: ${returnCid}`);

        // Save the hash to the DB task
        await prisma.task.update({
            where: { id: taskId },
            data: { ipfsHash: returnCid }
        });

        return returnCid;

    } catch (error) {
        console.error("Error aggregating and pinning results:", error);
        throw error;
    }
}
