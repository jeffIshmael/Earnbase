import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

interface Submission {
    id: number;
    responses: {
        response: string;
    }[];
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const { requestId } = await params;

        const task = await prisma.task.findUnique({
            where: { agentRequestId: requestId },
            include: {
                subtasks: true,
                submissions: {
                    include: {
                        responses: true
                    }
                }
            }
        });

        if (!task) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // Aggregate results
        const results: Record<string, number> = {};
        const submissions: Submission[] = task.submissions;

        // Support multiple choice aggregation
        if (task.feedbackType === "multiple_choice" || task.feedbackType === "rating") {
            submissions.forEach(sub => {
                sub.responses.forEach(res => {
                    const val = res.response; // string value
                    results[val] = (results[val] || 0) + 1;
                });
            });
        }

        // Calculate latency (mock for now, or based on createdAt vs submittedAt)
        // const avgLatency = ...

        return NextResponse.json({
            requestId: task.agentRequestId,
            status: task.status.toLowerCase(),
            summary: {
                participants: task.currentParticipants,
                completionRate: (task.currentParticipants / task.maxParticipants) * 100,
                averageLatencySeconds: 0, // TODO: Implement latency tracking
            },
            results: results,
            proofs: {
                // TODO: Integrate Merkle Proofs from Contract
                merkleRoot: null,
                payoutTx: null,
            }
        });

    } catch (error) {
        console.error("Agent Results Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
