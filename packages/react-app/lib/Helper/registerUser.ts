// this file has a function to register user on earnbase and bc

import { formatEther, parseEther } from "viem";
import { getUser, registerUser, updateEarnings } from "../Prismafnctns";
import { addTester, addUserReward, sendFundsToTesters } from "../WriteFunctions";
import { sendFarcasterNotification } from "../FarcasterNotify";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { getAgentSmartAccount } from "../Pimlico";
import { publicClient } from "./sendCelo";
import { erc20Abi } from "viem";
import { cUSDAddress } from "@/contexts/constants";
import dotenv from "dotenv";
dotenv.config();

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY ?? "",
});

const client = new NeynarAPIClient(config);

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
export async function sendMoneyAndNotify() {
    try {
      const { account, smartAccountClient } = await getAgentSmartAccount();
      console.log("✅ Smart account connected:", account.address);
  
      const winners = [
        {
          address: "0x847F89f5C9Da3431682E70C95a96df8D400401Fe",
          amount: "5",
          fid: 807443,
          position: 1,
        },
        {
          address: "0xBc078d70cf8486e3aAd3B6fDfE6C9D78b54EDDC0",
          amount: "3",
          fid: 605915,
          position: 2,
        },
        {
          address: "0xAE18b1b36A82EB0b7c655c217F762a3ae11dD2b6",
          amount: "2",
          fid: 1075326,
          position: 3,
        },
      ];

      const balance = await publicClient.readContract({
        abi: erc20Abi,
        address: cUSDAddress,
        functionName: "balanceOf",
        args: [account.address],
      });

      console.log(`💰 Current Balance :`, formatEther(balance));
  
    //   for (const winner of winners) {
    //     const balance = await publicClient.readContract({
    //       abi: erc20Abi,
    //       address: cUSDAddress,
    //       functionName: "balanceOf",
    //       args: [account.address],
    //     });
  
    //     console.log(`💰 Current Balance before sending to ${winner.address}:`, formatEther(balance));
  
    //     const address = winner.address as `0x${string}`;
    //     const amount = parseEther(winner.amount);
    //     const fids = [1077932];
  
    //     // const hash = await smartAccountClient.writeContract({
    //     //   abi: erc20Abi,
    //     //   address: cUSDAddress,
    //     //   functionName: "transfer",
    //     //   args: [address, amount],
    //     // });
  
    //     // if (!hash) {
    //     //   console.error(`❌ Transfer failed for ${winner.address}`);
    //     //   return;
    //     // }
  
    //     console.log(`✅ Sent ${winner.amount} cUSD to ${winner.address}`);
  
    //     const title = "🎉 You're a Winner!";
    //     const message = `Congrats! 🥳 You secured position #${winner.position} in the ChamaPay beta test and earned ${winner.amount} cUSD. Your reward has been sent to your wallet. 🚀`;
  
    //     const notification = {
    //       title,
    //       body: message,
    //       target_url: "https://chamapay-minipay.vercel.app/",
    //     };
  
    //     await client.publishFrameNotifications({ targetFids: fids, notification }).then((response) => {
    //       console.log(`📩 Sent winner notification to fid ${winner.fid}:`, response);
    //     });
    //   }
  
      // Notify all beta testers with appreciation
      // TODO: Implement getFids function or use hardcoded FIDs
      // const fids = await getFids();
      // if (!fids) return;
  
      // const title = "💚 Thanks for Testing!";
      // const appreciationMessage = "We truly appreciate your time and support during the ChamaPay beta testing! Blessings your way. 🌟";
  
      // const notification = {
      //   title,
      //   body: appreciationMessage,
      //   target_url: "https://chamapay-minipay.vercel.app/",
      // };
  
      // client.publishFrameNotifications({ targetFids:fids, notification }).then((response) => {
      //   console.log("response:", response);
      //   });
  
    } catch (error) {
      console.error("❌ An error occurred while sending rewards and notifications:", error);
    }
  }
  