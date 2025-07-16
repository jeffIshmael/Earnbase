// this file has a function to register user on earnbase and bc

import { parseEther } from "viem";
import { getUser, registerUser, updateEarnings } from "../Prismafnctns";
import { addTester, addUserReward } from "../WriteFunctions";

export async function registerRewardingUser(address: string): Promise<boolean>{
    try {
        // check whether user is registered
        const user = await getUser(address);
        if(user) return true;
        
        // add user to b.c
        const hash = await addTester([address as `0x${string}`]);
        if(!hash) return false;
       
            // add user to database
            const newUser = await registerUser("A referral",null,address,null);
            if(!newUser) return false;
        return true;
        
    } catch (error) {
        return false;
        
    }

}

export async function rewardingUser(address: string): Promise<boolean>{
    try {
        const amount = "0.2";
        // check whether user is registered
        const user = await getUser(address);
        if(!user) return false;
        
        // add userReward to b.c
        const hash = await addUserReward(amount,address as `0x${string}`);
        if(!hash) return false;
       
        // add user to database
        const updatedBalance = await updateEarnings(address,parseEther(amount));
        if(!updatedBalance) return false;
        return true;
        
    } catch (error) {
        return false;
        
    }

}