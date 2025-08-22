"use server"
// Task marketplace functions
import { PrismaClient, TaskStatus, ContactMethod, SubtaskType, SubmissionStatus } from "@prisma/client";
import { parseEther } from 'viem';

const prisma = new PrismaClient();

// function to create a new task
export async function createTask(
  creatorAddress: string,
  title: string,
  description: string,
  maxParticipants: number,
  baseReward: string,
  maxBonusReward: string,
  aiCriteria: string,
  contactMethod: ContactMethod,
  contactInfo: string,
  expiresAt?: Date
) {
  try {
    const creator = await prisma.user.findUnique({
      where: { walletAddress: creatorAddress }
    });
    if (!creator) throw new Error("Creator not found");

    const task = await prisma.task.create({
      data: {
        title,
        description,
        maxParticipants,
        baseReward: parseEther(baseReward),
        maxBonusReward: parseEther(maxBonusReward),
        totalDeposited: BigInt(0), // Will be updated when funds are deposited
        aiCriteria,
        contactMethod,
        contactInfo,
        expiresAt,
        creatorId: creator.id,
        status: TaskStatus.ACTIVE,
      },
      include: {
        creator: true,
        subtasks: true,
      }
    });

    return task;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

// function to add subtasks to a task
export async function addTaskSubtasks(
  taskId: number,
  subtasks: Array<{
    title: string;
    description?: string;
    type: SubtaskType;
    required: boolean;
    order: number;
    options?: string; // JSON string for multiple choice
    placeholder?: string;
    maxLength?: number;
    fileTypes?: string; // JSON string of allowed file types
  }>
) {
  try {
    const subtaskData = subtasks.map(subtask => ({
      ...subtask,
      taskId,
    }));

    const createdSubtasks = await prisma.taskSubtask.createMany({
      data: subtaskData,
    });

    return createdSubtasks;
  } catch (error) {
    console.error("Error adding subtasks:", error);
    throw error;
  }
}

// function to get all active tasks
export async function getActiveTasks() {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        status: TaskStatus.ACTIVE,
        currentParticipants: {
          lt: prisma.task.fields.maxParticipants,
        },
      },
      include: {
        creator: {
          select: {
            userName: true,
            walletAddress: true,
          }
        },
        subtasks: {
          orderBy: {
            order: 'asc',
          }
        },
        _count: {
          select: {
            submissions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return tasks;
  } catch (error) {
    console.error("Error getting active tasks:", error);
    throw error;
  }
}

// function to get a specific task with all details
export async function getTaskDetails(taskId: number) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: {
            userName: true,
            walletAddress: true,
          }
        },
        subtasks: {
          orderBy: {
            order: 'asc',
          }
        },
        submissions: {
          include: {
            user: {
              select: {
                userName: true,
                walletAddress: true,
              }
            }
          },
          orderBy: {
            submittedAt: 'desc',
          }
        },
        _count: {
          select: {
            submissions: true,
          }
        }
      }
    });

    return task;
  } catch (error) {
    console.error("Error getting task details:", error);
    throw error;
  }
}

// function to submit a task response
export async function submitTaskResponse(
  taskId: number,
  userAddress: string,
  subtaskResponses: Array<{
    subtaskId: number;
    response: string;
    fileUrl?: string;
  }>
) {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: userAddress }
    });
    if (!user) throw new Error("User not found");

    // Check if user already submitted to this task
    const existingSubmission = await prisma.taskSubmission.findFirst({
      where: {
        taskId,
        userId: user.id,
      }
    });

    if (existingSubmission) {
      throw new Error("User already submitted to this task");
    }

    // Create the submission
    const submission = await prisma.taskSubmission.create({
      data: {
        taskId,
        userId: user.id,
        status: SubmissionStatus.PENDING,
      }
    });

    // Create subtask responses
    const responseData = subtaskResponses.map(response => ({
      ...response,
      submissionId: submission.id,
    }));

    await prisma.subtaskResponse.createMany({
      data: responseData,
    });

    // Update task participant count
    await prisma.task.update({
      where: { id: taskId },
      data: {
        currentParticipants: {
          increment: 1,
        }
      }
    });

    return submission;
  } catch (error) {
    console.error("Error submitting task response:", error);
    throw error;
  }
}

// function to get user's task submissions
export async function getUserSubmissions(userAddress: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: userAddress }
    });
    if (!user) return [];

    const submissions = await prisma.taskSubmission.findMany({
      where: {
        userId: user.id,
      },
      include: {
        task: {
          select: {
            title: true,
            description: true,
            status: true,
          }
        },
        responses: {
          include: {
            subtask: {
              select: {
                title: true,
                type: true,
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc',
      }
    });

    return submissions;
  } catch (error) {
    console.error("Error getting user submissions:", error);
    throw error;
  }
}

// function to get creator's tasks
export async function getCreatorTasks(creatorAddress: string) {
  try {
    const creator = await prisma.user.findUnique({
      where: { walletAddress: creatorAddress }
    });
    if (!creator) return [];

    const tasks = await prisma.task.findMany({
      where: {
        creatorId: creator.id,
      },
      include: {
        subtasks: true,
        submissions: {
          include: {
            user: {
              select: {
                userName: true,
                walletAddress: true,
              }
            },
            responses: {
              include: {
                subtask: {
                  select: {
                    title: true,
                    type: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return tasks;
  } catch (error) {
    console.error("Error getting creator tasks:", error);
    throw error;
  }
} 