import { NextRequest, NextResponse } from 'next/server';
import { createCompleteTask } from '@/lib/Prismafnctns';
import { ContactMethod, SubtaskType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    if (request.headers.get("authorization") !== `Bearer ${process.env.CHAMAPAY_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      creatorAddress,
      title,
      description,
      maxParticipants,
      baseReward,
      maxBonusReward,
      aiCriteria,
      contactMethod,
      contactInfo,
      expiresAt,
      restrictionsEnabled,
      ageRestriction,
      minAge,
      maxAge,
      genderRestriction,
      gender,
      countryRestriction,
      countries,
      subtasks
    } = body;

    // Validate required fields
    if (!creatorAddress || !title || !description || !maxParticipants || !baseReward || !maxBonusReward || !aiCriteria || !contactInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate contact method
    if (!Object.values(ContactMethod).includes(contactMethod)) {
      return NextResponse.json(
        { error: 'Invalid contact method' },
        { status: 400 }
      );
    }

    // Validate subtasks
    if (!subtasks || subtasks.length === 0) {
      return NextResponse.json(
        { error: 'At least one subtask is required' },
        { status: 400 }
      );
    }

    // Validate subtask types
    for (const subtask of subtasks) {
      if (!Object.values(SubtaskType).includes(subtask.type)) {
        return NextResponse.json(
          { error: `Invalid subtask type: ${subtask.type}` },
          { status: 400 }
        );
      }
    }

    // Parse dates
    let parsedExpiresAt: Date | undefined;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiration date' },
          { status: 400 }
        );
      }
    }

    // Create the task data object
    const taskData = {
      title,
      description,
      blockChainId: `task_${Date.now()}`, // Generate a unique blockchain ID
      maxParticipants: parseInt(maxParticipants),
      baseReward,
      maxBonusReward,
      aiCriteria,
      contactMethod,
      contactInfo,
      expiresAt: parsedExpiresAt,
      restrictionsEnabled: restrictionsEnabled || false,
      ageRestriction: ageRestriction || false,
      minAge: minAge ? parseInt(minAge) : undefined,
      maxAge: maxAge ? parseInt(maxAge) : undefined,
      genderRestriction: genderRestriction || false,
      gender: gender || undefined,
      countryRestriction: countryRestriction || false,
      countries: countries || undefined,
    };

    // Create the subtasks data
    const subtasksData = subtasks.map((subtask: any, index: number) => ({
      title: subtask.title,
      description: subtask.description || undefined,
      type: subtask.type,
      required: subtask.required,
      options: subtask.options || undefined,
    }));

    // Create the complete task
    const createdTask = await createCompleteTask(creatorAddress, taskData, subtasksData);

    return NextResponse.json({
      success: true,
      task: createdTask,
      message: 'Task created successfully'
    });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 