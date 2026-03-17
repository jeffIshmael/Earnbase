import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const { requestId } = await params;

        const task = await prisma.task.findUnique({
            where: { agentRequestId: requestId },
            select: {
                agentRequestId: true,
                status: true,
                currentParticipants: true,
                maxParticipants: true,
                createdAt: true,
            }
        });

        if (!task) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // Map Prisma TaskStatus to Agent Status
        let agentStatus = "processing";
        if (task.status === "COMPLETED") agentStatus = "completed";
        if (task.status === "CANCELLED") agentStatus = "cancelled";

        return NextResponse.json({
            status: agentStatus,
            requestId: task.agentRequestId,
            summary: {
                participants: task.currentParticipants,
                maxParticipants: task.maxParticipants,
                completionRate: Math.round((task.currentParticipants / task.maxParticipants) * 100),
            },
            createdAt: task.createdAt,
        });

    } catch (error) {
        console.error("Agent Status Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
