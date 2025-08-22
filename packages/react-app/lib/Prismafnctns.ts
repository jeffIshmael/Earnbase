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

// function to return the array of testers in a task
export async function getTaskTesters(){
    const testers = await prisma.taskers.findMany({
        select:{
            taskersArray: true
        }
    })
    const testerArray = JSON.parse(testers[0].taskersArray);
    return testerArray;
}

// function to return testers in the order of earned cUSD (For the leaderboard)
export async function getTestersLeaderboard (){
    const users = await prisma.user.findMany({
        where:{
            isTester: true,        
        }, select:{
         totalEarned: true,
         walletAddress: true,
         userName: true,
        },
        orderBy:{
            totalEarned:'desc',
        }
    })
    return users;
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

// function to record a task
export async function recordTask(subTaskId: number, completed: boolean, reward: string, ipfsHash: string | null, feedback: string | null, address: string){
    try {
        const user = await getUser(address);
        if (!user) return null;

        const task = await prisma.task.create({
            data: {
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

// function to update the unclaimed amounts
export async function updateUnclaimed(address: string, amount: bigint) {
    try {
        await prisma.user.update({
            where: {
                walletAddress: address,
            },
            data: {
                claimable: {
                    decrement: amount
                },
            }
        });

        return true;
    } catch (error) {
        console.error("Error updating unclaimed amounts:", error);
        throw error;
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
              claimable: {
                  increment: amount
              },
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

// function to get the testers
export async function getTesters(){
    const testers = await prisma.taskers.findMany();
    if(testers.length > 0) return testers[0].taskersArray;
    return JSON.stringify([]);
    
}

// function to get fids from the testers
export async function getFids() {
  const taskersAddresses = await getTesters();
  const taskerAddressesArray: string[] = JSON.parse(taskersAddresses);

  if (taskerAddressesArray.length == 0) return;

  // Query all users with those wallet addresses
  const users = await prisma.user.findMany({
    where: {
      walletAddress: {
        in: taskerAddressesArray,
      },
    },
    select: {
      fid: true,
    },
  });

  // Filter out null fids and return array
  const fids = users
    .map((user) => user.fid)
    .filter((fid): fid is number => fid !== null);

  return fids;
}


// function to register taskers.
export async function addTester(testerId: number, taskId: string, addresses: string[]) {
    try {
      // Check if the tasker already exists by id
      const existingTasker = await prisma.taskers.findUnique({
        where: { id: testerId },
        select: { taskersArray: true },
      });
  
      if (!existingTasker) {
        // If not found, create a new tasker
        const newTasker = await prisma.taskers.create({
          data: {
            id: testerId,
            taskId,
            taskersArray: JSON.stringify(addresses),
          },
        });
        return newTasker;
      }
  
      // If found, merge new addresses (without duplicates)
      const currentAddresses: string[] = JSON.parse(existingTasker.taskersArray);
      const uniqueAddresses = Array.from(new Set([...currentAddresses, ...addresses]));
  
      const updatedTasker = await prisma.taskers.update({
        where: { id: testerId },
        data: {
          taskersArray: JSON.stringify(uniqueAddresses),
        },
      });
  
      return updatedTasker;
    } catch (error) {
      console.error("Error updating taskers:", error);
      throw error;
    }
  }

// function to update the tasker boolean of a user
export async function updateAsTasker( address: string) {
    try {
      const user = getUser(address);
      if(!user) return;
      const updateUser = await prisma.user.update({
        where:{
            walletAddress: address,
        },
        data:{
            isTester: true,
        }
      });
      return updateUser;
    } catch (error) {
      console.error("Error updating taskers:", error);
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
  expiresAt?: Date
) {
  try {
    const creator = await getUser(creatorAddress);
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