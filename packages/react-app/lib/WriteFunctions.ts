"use server"
// This file contains blockchain write functions by the agent
import { createPublicClient, http, createWalletClient, parseUnits } from 'viem';
import { celo, base } from 'viem/chains';
import { contractAbi, contractAddress } from '@/contexts/constants';
import { getAgentSmartAccount } from './Pimlico';

// function to add a reward on the user 
export async function addUserReward(amount: string, userAddress: `0x${string}`): Promise<string | null> {
    try {
        // change amount to big int
        const amountInWei = parseUnits(amount, 6);
        const { account, smartAccountClient } = await getAgentSmartAccount();
        console.log("The agent account address", account.address);
        const hash = await smartAccountClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'addRewards',
            args: [userAddress, amountInWei],
        })

        console.log("The agent smart account txHash", hash);

        return hash;

    } catch (error) {
        console.log('the error', error);
        return null;
    }
}

// make payment to the user
export async function makePaymentToUser(amount: string, userAddress: `0x${string}`, taskId: number): Promise<string | null> {
    try {
        const amountInWei = parseUnits(amount, 6);
        const taskIdInBigInt = BigInt(taskId);
        const { account, smartAccountClient } = await getAgentSmartAccount();
        console.log("The agent account address", account.address);
        const hash = await smartAccountClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'makePayment',
            args: [userAddress, amountInWei, taskIdInBigInt],
        })
        return hash;
    } catch (error) {
        console.log('the error', error);
        return null;
    }
}

export async function addUserSmartAccount(smartAccountAddress: `0x${string}`, userAddress: `0x${string}`): Promise<string | null> {
    try {
        const { account, smartAccountClient } = await getAgentSmartAccount();
        const hash = await smartAccountClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'updateSmartWallet',
            args: [smartAccountAddress, userAddress],
        })

        console.log("The agent smart account txHash", hash);

        return hash;

    } catch (error) {
        console.log('the error', error);
        return null;
    }
}

// function to add a reward on the user 
export async function addTester(address: `0x${string}`[]): Promise<string | null> {
    try {
        const { account, smartAccountClient } = await getAgentSmartAccount();
        console.log("The agent account address", account.address);
        const hash = await smartAccountClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'addTesters',
            args: [address],
        })

        console.log("The agent smart account txHash", hash);

        return hash;

    } catch (error) {
        console.log('the error', error);
        return null;
    }
}

// function to add funds for a task
export async function addFundsForTask(amount: string, taskId: number): Promise<string | null> {
    try {
        const amountInWei = parseUnits(amount, 6);
        const taskIdInBigInt = BigInt(taskId);
        const { account, smartAccountClient } = await getAgentSmartAccount();
        const hash = await smartAccountClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'depositForTask',
            args: [taskIdInBigInt, amountInWei],
        })
        return hash;
    } catch (error) {
        console.log('the error', error);
        return null;
    }
}

// function to deposit USDC to the contract
export async function depositUSDC(amount: string): Promise<string | null> {
    try {
        const amountInWei = parseUnits(amount, 6);
        const { account, smartAccountClient } = await getAgentSmartAccount();
        const hash = await smartAccountClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'depositCUSD', // Contract might still name it depositCUSD but we treat it as USDC
            args: [amountInWei],
        })
        return hash;
    } catch (error) {
        console.log('the error', error);
        return null;
    }
}

// function to delete a task

export async function deleteTask(taskId: number): Promise<string | null> {
    try {
        const taskIdInBigInt = BigInt(taskId);
        const { account, smartAccountClient } = await getAgentSmartAccount();
        const hash = await smartAccountClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'deleteTask',
            args: [taskIdInBigInt],
        })
        return hash;
    } catch (error) {
        console.log('the error', error);
        return null;
    }
}


// function to send funds to all testers
export async function sendFundsToTesters(amount: string): Promise<string | null> {
    try {
        const amountInWei = parseUnits(amount, 6);
        const { account, smartAccountClient } = await getAgentSmartAccount();
        console.log("The agent account address", account.address);
        const hash = await smartAccountClient.writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'sendAmount',
            args: [amountInWei],
        })

        console.log("The agent smart account txHash", hash);

        return hash;

    } catch (error) {
        console.log('the error', error);
        return null;
    }
}
