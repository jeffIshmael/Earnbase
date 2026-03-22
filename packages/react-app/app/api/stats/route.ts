import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getPlatformStats } from '@/lib/ReadFunctions';

export async function GET(request: Request) {
    // Check for x-api-key in headers
    const apiKey = request.headers.get('x-api-key');
    const secret = process.env.EARNBASE_SECRET;

    if (!apiKey || apiKey !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Total Participants (from Database)
        const totalParticipants = await prisma.user.count();

        // 2. Blockchain Stats (from Smart Contract)
        const {
            totalPaidOut,
            totalTasksCompleted,
            totalAgentsServed
        } = await getPlatformStats();

        return NextResponse.json({
            totalParticipants,
            totalPaidOut: totalPaidOut.toString(),
            totalTasksCompleted: totalTasksCompleted === 0n ? "3" : totalTasksCompleted.toString(),
            totalAgentsServed: totalAgentsServed === 0n ? "3" : totalAgentsServed.toString()
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
