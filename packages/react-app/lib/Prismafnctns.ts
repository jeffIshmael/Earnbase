"use server"
// this file contains prisma functions
import { PrismaClient, TaskStatus, ContactMethod, SubtaskType, SubmissionStatus } from "@prisma/client";
import { parseEther } from 'viem';

const prisma = new PrismaClient();

// function to check if the user is registered
export async function getUser(address: string){
    const user = await prisma.user.findUnique({
        where:{
            walletAddress: address,
        },
        include:{
            tasks: true,
            createdTasks: true,
            submissions: true,
        }
    })
    if (!user) return null;
    return user;
}

// function to register a user
export async function registerUser(userName:string,fid:number|null,address:string, smartAddress: string | null){
    try {
        const user = await prisma.user.create({
            data:{
                walletAddress: address,
                userName: userName,
                fid: fid,
                smartAddress: smartAddress?? smartAddress,
            }
        })
        const allUser = await prisma.user.findUnique({
            where:{
                id: user.id,
            },
            include:{
                tasks: true,
                createdTasks: true,
                submissions: true,
            }
        })
        return allUser;       
    } catch (error) {
        return null;
    }  
}


// function to check if the smart account addresss has been set
export async function checkIfSmartAccount(address: string){
        const user = await prisma.user.findUnique({
            where:{
                walletAddress: address,
            }
        })
        if (!user?.smartAddress) return false;
        return true;
}


// function to set smart account address
export async function setSmartAccount(address: string, smartAddress:string){
    if(await checkIfSmartAccount(address)) return;
    try {
        // update the smart address
        const user = await prisma.user.update({
            where:{
                walletAddress: address,
            },
            data:{
                smartAddress: smartAddress,
            }
        })
        return user;
    } catch (error) {
        console.error("Error updating smart account:", error);
        return null;
    }
}

// function to record a task (legacy function - use new marketplace functions instead)
export async function recordTask(subTaskId: number, completed: boolean, reward: string, ipfsHash: string | null, feedback: string | null, address: string){
    try {
        const user = await getUser(address);
        if (!user) return null;

        // Create a legacy task with required new fields
        const task = await prisma.task.create({
            data: {
                title: `Legacy Task ${subTaskId}`,
                description: `Legacy task completion`,
                maxParticipants: 1,
                currentParticipants: 1,
                baseReward: parseEther(reward),
                maxBonusReward: BigInt(0),
                totalDeposited: parseEther(reward),
                status: TaskStatus.ACTIVE,
                aiCriteria: "Legacy task",
                contactMethod: ContactMethod.EMAIL,
                contactInfo: "legacy@earnbase.com",
                creatorId: user.id,
                // Legacy fields
                subTaskId: subTaskId,
                completed: completed,
                reward: parseEther(reward),
                ipfsHash: ipfsHash,
                feedback: feedback,
                userId: user.id,
            }
        });
        return task;
    } catch (error) {
        console.error("Error recording task:", error);
        return null;
    }
}

// function to update the earned
export async function updateEarnings(address: string, amount: bigint) {
  try {
      // Get user
      const user = await getUser(address);
      if (!user) {
          throw new Error("User not found");
      }

      // Update both totalEarned (increment) and claimable (decrement)
      await prisma.user.update({
          where: {
              walletAddress: address,
          },
          data: {
              totalEarned:{
                increment: amount,
              }
          }
      });

      return true;
  } catch (error) {
      console.error("Error updating unclaimed amounts:", error);
      throw error;
  }
}



  
// function to get the user's feedback from a task
export async function getUserFeedback(address:string, taskId:number){
  try {
    // check if is a 
  const task = await prisma.task.findMany({
    where:{
      user:{
        walletAddress: address,
      },
      subTaskId: taskId,
    }
  })
  if(!task) return null;
  return task;
    
  } catch (error) {
    return null;
  }
}

// ===== NEW TASK MARKETPLACE FUNCTIONS =====

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
  expiresAt?: Date,
  // New restriction parameters
  restrictionsEnabled?: boolean,
  ageRestriction?: boolean,
  minAge?: number,
  maxAge?: number,
  genderRestriction?: boolean,
  gender?: string,
  countryRestriction?: boolean,
  countries?: string[]
) {
  try {
    let creator = await getUser(creatorAddress);
    if (!creator) {
      const user = await registerUser(creatorAddress, null, creatorAddress, null);
      if (!user) throw new Error("Failed to register user");
      creator = user;
    };

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
        // New restriction fields
        restrictionsEnabled: restrictionsEnabled || false,
        ageRestriction: ageRestriction || false,
        minAge: minAge || null,
        maxAge: maxAge || null,
        genderRestriction: genderRestriction || false,
        gender: gender || null,
        countryRestriction: countryRestriction || false,
        countries: countries ? JSON.stringify(countries) : null,
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

// New function to create a complete task with subtasks in one transaction
export async function createCompleteTask(
  creatorAddress: string,
  taskData: {
    title: string;
    description: string;
    blockChainId: string;
    maxParticipants: number;
    baseReward: string;
    maxBonusReward: string;
    aiCriteria: string;
    contactMethod: ContactMethod;
    contactInfo: string;
    expiresAt?: Date;
    restrictionsEnabled?: boolean;
    ageRestriction?: boolean;
    minAge?: number;
    maxAge?: number;
    genderRestriction?: boolean;
    gender?: string;
    countryRestriction?: boolean;
    countries?: string[];
  },
  subtasks: Array<{
    title: string;
    description?: string;
    type: SubtaskType;
    required: boolean;
    options?: string;
  }>
) {
  try {
    let creator = await getUser(creatorAddress);
    if (!creator) {
      const user = await registerUser(creatorAddress, null, creatorAddress, null);
      if (!user) throw new Error("Failed to register user");
      creator = user;
    };

    // Create task and subtasks in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the task
      const task = await tx.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          blockChainId: taskData.blockChainId,
          maxParticipants: taskData.maxParticipants,
          baseReward: parseEther(taskData.baseReward),
          maxBonusReward: parseEther(taskData.maxBonusReward),
          totalDeposited: BigInt(0),
          aiCriteria: taskData.aiCriteria,
          contactMethod: taskData.contactMethod,
          contactInfo: taskData.contactInfo,
          expiresAt: taskData.expiresAt,
          restrictionsEnabled: taskData.restrictionsEnabled || false,
          ageRestriction: taskData.ageRestriction || false,
          minAge: taskData.minAge || null,
          maxAge: taskData.maxAge || null,
          genderRestriction: taskData.genderRestriction || false,
          gender: taskData.gender || null,
          countryRestriction: taskData.countryRestriction || false,
          countries: taskData.countries ? JSON.stringify(taskData.countries) : null,
          creatorId: creator.id,
          status: TaskStatus.ACTIVE,
        },
        include: {
          creator: true,
        }
      });

      // Create subtasks if provided
      if (subtasks && subtasks.length > 0) {
        const subtaskData = subtasks.map((subtask, index) => ({
          taskId: task.id,
          title: subtask.title,
          description: subtask.description || null,
          type: subtask.type,
          required: subtask.required,
          order: index + 1,
          options: subtask.options || null,
        }));

        await tx.taskSubtask.createMany({
          data: subtaskData,
        });
      }

      return task;
    });

    // Return the complete task with subtasks
    return await getTaskDetails(result.id);
  } catch (error) {
    console.error("Error creating complete task:", error);
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

// New function to get tasks with restrictions applied
export async function getTasksWithRestrictions(
  userAge?: number,
  userGender?: string,
  userCountry?: string
) {
  try {
    let whereClause: any = {
      status: TaskStatus.ACTIVE,
      currentParticipants: {
        lt: prisma.task.fields.maxParticipants,
      },
    };

    // Apply age restrictions
    if (userAge !== undefined) {
      whereClause.OR = [
        { ageRestriction: false }, // No age restriction
        {
          ageRestriction: true,
          minAge: { lte: userAge },
          maxAge: { gte: userAge },
        }
      ];
    }

    // Apply gender restrictions
    if (userGender) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { genderRestriction: false }, // No gender restriction
        {
          genderRestriction: true,
          gender: userGender,
        }
      ];
    }

    // Apply country restrictions
    if (userCountry) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { countryRestriction: false }, // No country restriction
        {
          countryRestriction: true,
          countries: {
            contains: userCountry,
          }
        }
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
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
    console.error("Error getting tasks with restrictions:", error);
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
    const user = await getUser(userAddress);
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
    const user = await getUser(userAddress);
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
    const creator = await getUser(creatorAddress);
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