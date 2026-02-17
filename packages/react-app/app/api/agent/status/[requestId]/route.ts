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
        let agentStatus = "pending";
        if (task.status === "ACTIVE") agentStatus = "active";
        if (task.status === "COMPLETED" || task.status === "PAUSED") agentStatus = "completed"; // Or paused?

        return NextResponse.json({
            requestId: task.agentRequestId,
            status: agentStatus,
            summary: {
                participants: task.currentParticipants,
                maxParticipants: task.maxParticipants,
                completionRate: (task.currentParticipants / task.maxParticipants) * 100,
            },
            createdAt: task.createdAt,
        });

    } catch (error) {
        console.error("Agent Status Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
