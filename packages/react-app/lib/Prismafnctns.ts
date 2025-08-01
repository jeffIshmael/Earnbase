"use server"
// this file contains prisma functions
import { PrismaClient } from "@prisma/client";
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
                tasks:true,

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
        return null;
    }


}

// function to update a task
export async function recordTask(
    taskId: number,
    hasClaimed: boolean, 
    amount: string, 
    aiRating: string | null, 
    feedback: string, 
    address: string
  ) {
    try {
      // get user from address
      const user = await getUser(address);
      if (!user) return;
      
      const task = await prisma.task.create({
        data: {
          subTaskId: taskId,
          userId: user?.id,
          completed: taskId == 5 ? false : true,
          claimed: hasClaimed,
          reward: parseEther(amount),
          aiRating: aiRating ? aiRating : null,
          feedback: feedback ? feedback : null,
        }
      });
  
      // Prepare the update data
      const updateData: {
        totalEarned: { increment: bigint };
        claimable?: { increment: bigint };
      } = {
        totalEarned: {
          increment: parseEther(amount),
        }
      };
  
      // Only increment claimable if reward hasn't been claimed
      if (!hasClaimed) {
        updateData.claimable = {
          increment: parseEther(amount),
        };
      }
  
      // update the user's total earnings & unclaimed
      await prisma.user.update({
        where: {
          walletAddress: address,
        },
        data: updateData
      });
  
      return task;
    } catch (error) {
      console.error("Error in recordTask:", error);
      return null;
    }   
  }

// function to get the task of user
export async function getTaskOutput(address:string, taskId:number){
    try {
        // get user
        const user = await getUser(address);
        if(!user) return;
        const task = await prisma.task.findMany({
            where:{
                userId: user.id,
                subTaskId: taskId,
            }
        })
        return task;
        
    } catch (error) {
        return null;
    }

}

// function to update total earned & unclaimed
export async function updateUnclaimed(address: string, amount: bigint) {
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