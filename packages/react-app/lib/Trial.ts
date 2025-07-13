"use server"
import { parseEther } from 'viem';
// this file contains prisma functions
import { PrismaClient } from "@prisma/client";

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