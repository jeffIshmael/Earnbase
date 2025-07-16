// this file has a function to register user on earnbase and bc

import { parseEther } from "viem";
import { getFids, getUser, registerUser, updateEarnings } from "../Prismafnctns";
import { addTester, addUserReward, sendFundsToTesters } from "../WriteFunctions";
import { sendFarcasterNotification } from "../FarcasterNotify";

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

// function to send funds to all the testers and notify them
export async function sendMoneyAndNotify(amount:string){
   // send the funds
   const hash = await sendFundsToTesters(amount);

   if(!hash) return;


    const fids = await getFids();
    if(!fids) return;

    const title =`You have received ${amount} cUSD.`
    const message = "Please join your assigned chama and make a 1cUSD payment."

    const notification = {
        title,
        body: message,
        target_url: "https://chamapay-minipay.vercel.app/",
      };


   
      
      fetch('https://api.neynar.com/v2/farcaster/frame/notifications/')
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));

    // send farcaster notification
    // await sendFarcasterNotification(fids,title, message);

}
