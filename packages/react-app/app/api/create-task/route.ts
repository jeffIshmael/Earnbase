import { NextResponse } from 'next/server';
import { createTask, addTaskSubtasks } from '@/lib/TaskMarketplace';
import { z } from 'zod';

const SubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
  description: z.string().optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'TEXT_INPUT', 'FILE_UPLOAD', 'CHOICE_SELECTION', 'RATING']),
  required: z.boolean().default(true),
  order: z.number().min(1),
  options: z.string().optional(), // JSON string for multiple choice
  placeholder: z.string().optional(),
  maxLength: z.number().optional(),
  fileTypes: z.string().optional(), // JSON string of allowed file types
});

const CreateTaskSchema = z.object({
  creatorAddress: z.string().min(1, "Creator address is required"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().min(1, "Task description is required"),
  maxParticipants: z.number().min(1, "Max participants must be at least 1"),
  baseReward: z.string().min(1, "Base reward is required"),
  maxBonusReward: z.string().min(1, "Max bonus reward is required"),
  aiCriteria: z.string().min(1, "AI criteria is required"),
  contactMethod: z.enum(['EMAIL', 'WHATSAPP', 'BOTH']),
  contactInfo: z.string().min(1, "Contact info is required"),
  expiresAt: z.string().optional(), // ISO date string
  subtasks: z.array(SubtaskSchema).min(1, "At least one subtask is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = CreateTaskSchema.parse(body);

    // Parse expiresAt if provided
    const expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined;

    // Create the task
    const task = await createTask(
      validatedData.creatorAddress,
      validatedData.title,
      validatedData.description,
      validatedData.maxParticipants,
      validatedData.baseReward,
      validatedData.maxBonusReward,
      validatedData.aiCriteria,
      validatedData.contactMethod,
      validatedData.contactInfo,
      expiresAt
    );

    if (!task) {
      throw new Error("Failed to create task");
    }

    // Add subtasks to the task
    const subtasks = await addTaskSubtasks(task.id, validatedData.subtasks);

    if (!subtasks) {
      throw new Error("Failed to add subtasks");
    }

    return NextResponse.json({ 
      success: true, 
      taskId: task.id,
      message: "Task created successfully" 
    });

  } catch (error) {
    console.error("Task creation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }, { status: 500 });
  }
} 