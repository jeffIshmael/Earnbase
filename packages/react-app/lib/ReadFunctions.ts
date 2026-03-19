// this file contains the read functions for the blockchain

import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';
import { contractAbi, contractAddress } from '@/blockchain/constants';

const publicClient = createPublicClient({
  chain: celo,
  transport: http()
});


/**
 * Get platform-wide statistics from the EarnBase contract
 */
export async function getPlatformStats() {
  try {
    const totalPaidOut = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'totalPaidOut',
      args: []
    }) as bigint;

    const totalTasksCompleted = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'totalTasksCompleted',
      args: []
    }) as bigint;

    const totalAgentsServed = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'totalAgentsServed',
      args: []
    }) as bigint;

    return {
      totalPaidOut,
      totalTasksCompleted,
      totalAgentsServed
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    throw error;
  }
}



/**
 * Get the contract owner
 */
export async function getOwner() {
  try {
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'owner',
      args: []
    });
    return owner as `0x${string}`;
  } catch (error) {
    console.error('Error getting owner:', error);
    throw error;
  }
}
