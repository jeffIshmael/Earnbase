import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        // Optional: ERC-8004 Agent Verification could be applied here
        // However, since it's just querying results (which are public on IPFS anyway), 
        // we can allow open querying by agentRequestId.

        console.log("we hit the endpoint.")

        const url = new URL(req.url);
        const agentRequestId = url.searchParams.get("agentRequestId") || url.searchParams.get("requestId");

        console.log(`🔍 Agent Result Query: ${agentRequestId || "missing id"}`);

        if (!agentRequestId) {
            return NextResponse.json({ error: "Missing requestId parameter" }, { status: 400 });
        }

        const task = await prisma.task.findUnique({
            where: { agentRequestId: agentRequestId },
            select: {
                id: true,
                status: true,
                currentParticipants: true,
                maxParticipants: true,
                ipfsHash: true,
                blockChainId: true,
                agentRequestId: true,
                title: true,
            }
        });

        if (!task) {
            console.log(`❌ Task not found for ID: ${agentRequestId}`);
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        console.log(`✅ Found Task: ${task.title} (Status: ${task.status}, Submissions: ${task.currentParticipants}/${task.maxParticipants})`);

        if (task.status !== 'COMPLETED' || !task.ipfsHash) {
            return NextResponse.json({
                status: "processing",
                requestId: task.agentRequestId,
                message: "Task is still gathering participants or finalizing results.",
                progress: `${task.currentParticipants}/${task.maxParticipants}`
            }, { status: 202 });
        }

        const gatewayUrl = process.env.PINATA_GATEWAY
            ? `https://${process.env.PINATA_GATEWAY}/ipfs/${task.ipfsHash}`
            : `https://gateway.pinata.cloud/ipfs/${task.ipfsHash}`;

        return NextResponse.json({
            status: "completed",
            requestId: task.agentRequestId,
            taskId: task.id,
            ipfsHash: task.ipfsHash,
            resultsUrl: gatewayUrl
        }, { status: 200 });

    } catch (error) {
        console.error("Error querying agent results:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
