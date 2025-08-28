import { NextRequest, NextResponse } from 'next/server';
import { saveTaskSubmission } from '@/lib/Prismafnctns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      taskId,
      userAddress,
      subtaskResponses,
      aiRating,
      aiFeedback,
      totalReward
    } = body;

    // Validate required fields
    if (!taskId || !userAddress || !subtaskResponses || !aiRating || !totalReward) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save the task submission
    const submission = await saveTaskSubmission(
      taskId,
      userAddress,
      subtaskResponses,
      aiRating,
      aiFeedback || 'No feedback provided',
      totalReward
    );

    return NextResponse.json({
      success: true,
      submission,
      message: 'Task submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json(
      { error: 'Failed to submit task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 