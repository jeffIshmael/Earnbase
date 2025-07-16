
// This file contains blockchain write functions by the agent
import { createPublicClient, http, createWalletClient, parseEther } from 'viem';
import { celo, base } from 'viem/chains';
import { contractAbi, contractAddress } from '@/contexts/constants';
import {getAgentSmartAccount} from './Pimlico';

// function to add a reward on the user 
export async function addUserReward(amount: string, userAddress: `0x${string}`):Promise <string | null>{
    try {
    // change amount to big int
    const amountInWei = parseEther(amount);
    const {account, smartAccountClient} = await getAgentSmartAccount();
    console.log("The agent account address", account.address);
    const hash = await smartAccountClient.writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'addRewards',
        args:[userAddress, amountInWei],
      })

      console.log("The agent smart account txHash", hash);

    return hash;
        
    } catch (error) {
        console.log('the error', error);
        return null;        
    }
}

export async function addUserSmartAccount(smartAccountAddress: `0x${string}`, userAddress: `0x${string}`):Promise <string | null>{
    try {
    const {account, smartAccountClient} = await getAgentSmartAccount();
    const hash = await smartAccountClient.writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'updateSmartWallet',
        args:[ smartAccountAddress,userAddress],
      })

      console.log("The agent smart account txHash", hash);

    return hash;
        
    } catch (error) {
        console.log('the error', error);
        return null;        
    }
}

// function to add a reward on the user 
export async function addTester( address: `0x${string}`[]):Promise <string | null>{
    try {
    const {account, smartAccountClient} = await getAgentSmartAccount();
    console.log("The agent account address", account.address);
    const hash = await smartAccountClient.writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'addTesters',
        args:[address],
      })

      console.log("The agent smart account txHash", hash);

    return hash;
        
    } catch (error) {
        console.log('the error', error);
        return null;        
    }
}

