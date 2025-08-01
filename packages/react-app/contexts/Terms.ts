
import { addUserReward } from "@/lib/WriteFunctions";

// This file contains constants in the project
export const baseReward = 0.5; // Base reward for submitting

// function to add rewards to user's wallet
export async function addRewardsToUser(aiRating: number, address: `0x${string}`): Promise < string| null>{
    try {
        const bonusReward = (aiRating / 10).toFixed(2); // Bonus based on AI rating (0.0-1.0 cUSD)
        const totalReward = (baseReward + parseFloat(bonusReward)).toFixed(2);
        // add this reward to the user
        const result = await addUserReward(totalReward, address);
        if(!result){
            return null;
        }
        return result;
      } catch (error) {
        console.log(error);
        return null;        
      }
}