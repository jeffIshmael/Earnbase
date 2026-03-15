import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        // Optional: ERC-8004 Agent Verification could be applied here
        // However, since it's just querying results (which are public on IPFS anyway), 
        // we can allow open querying by agentRequestId.

        const url = new URL(req.url);
        const agentRequestId = url.searchParams.get("agentRequestId");

        if (!agentRequestId) {
            return NextResponse.json({ error: "Missing agentRequestId parameter" }, { status: 400 });
        }

        const task = await prisma.task.findUnique({
            where: { agentRequestId: agentRequestId },
            select: {
                id: true,
                status: true,
                currentParticipants: true,
                maxParticipants: true,
                ipfsHash: true,
                blockChainId: true, // Used if we want to return the on-chain ID
            }
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        if (task.status !== 'COMPLETED' || !task.ipfsHash) {
            return NextResponse.json({
                status: "processing",
                message: "Task is still gathering participants or finalizing results.",
                progress: `${task.currentParticipants}/${task.maxParticipants}`
            }, { status: 202 }); // 202 Accepted (Processing)
        }

        // If completed, return the IPFS hash and gateway URL
        // Agents can either use the raw IPFS hash or fetch the URL directly
        const gatewayUrl = process.env.PINATA_GATEWAY
            ? `https://${process.env.PINATA_GATEWAY}/ipfs/${task.ipfsHash}`
            : `https://gateway.pinata.cloud/ipfs/${task.ipfsHash}`;

        return NextResponse.json({
            status: "completed",
            taskId: task.id,
            ipfsHash: task.ipfsHash,
            resultsUrl: gatewayUrl
        }, { status: 200 });

    } catch (error) {
        console.error("Error querying agent results:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
