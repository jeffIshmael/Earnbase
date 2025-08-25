// this file contains the read functions for the blockchain

import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';
import { contractAbi, contractAddress } from '@/contexts/constants';

const publicClient = createPublicClient({
  chain: celo,
  transport: http()
});

// ────────────────────────────────
// Task Related Read Functions
// ────────────────────────────────

/**
 * Get the total number of tasks
 */
export async function getTotalTasks() {
  try {
    const totalTasks = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'totalTasks',
      args: []
    });
    return totalTasks as bigint;
  } catch (error) {
    console.error('Error getting total tasks:', error);
    throw error;
  }
}

/**
 * Get basic task details by task ID
 */
export async function getTask(taskId: bigint) {
  try {
    const task = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getTask',
      args: [taskId]
    }) as [bigint, `0x${string}`, bigint, bigint, bigint];
    
    return {
      id: task[0],
      creator: task[1],
      totalTestersCount: task[2],
      totalAmount: task[3],
      paidAmount: task[4]
    };
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
}

/**
 * Get detailed task information including participants and their earnings
 */
export async function getTaskDetails(taskId: bigint) {
  try {
    const taskDetails = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getTaskDetails',
      args: [taskId]
    }) as [bigint, `0x${string}`, bigint, bigint, bigint, `0x${string}`[], bigint[]];
    
    return {
      id: taskDetails[0],
      creator: taskDetails[1],
      participantCount: taskDetails[2],
      totalAmount: taskDetails[3],
      paidAmount: taskDetails[4],
      participants: taskDetails[5],
      participantAmounts: taskDetails[6]
    };
  } catch (error) {
    console.error('Error getting task details:', error);
    throw error;
  }
}

/**
 * Get task statistics including amounts and payment count
 */
export async function getTaskStats(taskId: bigint) {
  try {
    const stats = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getTaskStats',
      args: [taskId]
    }) as [bigint, bigint, bigint, bigint];
    
    return {
      totalAmount: stats[0],
      paidAmount: stats[1],
      remainingAmount: stats[2],
      paymentCount: stats[3]
    };
  } catch (error) {
    console.error('Error getting task stats:', error);
    throw error;
  }
}

/**
 * Get all payments for a specific task
 */
export async function getTaskPayments(taskId: bigint) {
  try {
    const payments = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getTaskPayments',
      args: [taskId]
    }) as Array<{
      id: bigint;
      taskId: bigint;
      receiver: `0x${string}`;
      amount: bigint;
      timestamp: bigint;
    }>;
    
    return payments.map(payment => ({
      id: payment.id,
      taskId: payment.taskId,
      receiver: payment.receiver,
      amount: payment.amount,
      timestamp: payment.timestamp
    }));
  } catch (error) {
    console.error('Error getting task payments:', error);
    throw error;
  }
}

/**
 * Get task participants and their earnings
 */
export async function getTaskParticipants(taskId: bigint) {
  try {
    const participants = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getTaskParticipants',
      args: [taskId]
    }) as [`0x${string}`[], bigint[]];
    
    return {
      participantAddresses: participants[0],
      participantAmounts: participants[1]
    };
  } catch (error) {
    console.error('Error getting task participants:', error);
    throw error;
  }
}

// ────────────────────────────────
// Tester Related Read Functions
// ────────────────────────────────

/**
 * Get total number of testers
 */
export async function getTotalTesters() {
  try {
    const totalTesters = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'totalTesters',
      args: []
    });
    return totalTesters as bigint;
  } catch (error) {
    console.error('Error getting total testers:', error);
    throw error;
  }
}

/**
 * Get all registered tester addresses
 */
export async function getAllTesters() {
  try {
    const testers = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getAllTesters',
      args: []
    });
    return testers as `0x${string}`[];
  } catch (error) {
    console.error('Error getting all testers:', error);
    throw error;
  }
}

/**
 * Check if an address is registered as a tester
 */
export async function checkIfTester(address: `0x${string}`) {
  try {
    const isTester = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'isTester',
      args: [address]
    });
    return isTester as boolean;
  } catch (error) {
    console.error('Error checking if tester:', error);
    throw error;
  }
}

/**
 * Get detailed tester information
 */
export async function getTesterInfo(testerAddress: `0x${string}`) {
  try {
    const testerInfo = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getTesterInfo',
      args: [testerAddress]
    }) as [bigint, bigint[], `0x${string}`, `0x${string}`, bigint];
    
    return {
      id: testerInfo[0],
      taskIds: testerInfo[1],
      smartAddress: testerInfo[2],
      normalAddress: testerInfo[3],
      totalEarned: testerInfo[4]
    };
  } catch (error) {
    console.error('Error getting tester info:', error);
    throw error;
  }
}

/**
 * Get tester's earnings from a specific task
 */
export async function getTesterTaskEarnings(testerAddress: `0x${string}`, taskId: bigint) {
  try {
    const earnings = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getTesterTaskEarnings',
      args: [testerAddress, taskId]
    });
    return earnings as bigint;
  } catch (error) {
    console.error('Error getting tester task earnings:', error);
    throw error;
  }
}

/**
 * Get all payments for a specific tester
 */
export async function getTesterPayments(testerAddress: `0x${string}`) {
  try {
    const testerPayments = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'getTesterPayments',
      args: [testerAddress]
    }) as Array<{
      id: bigint;
      taskId: bigint;
      receiver: `0x${string}`;
      amount: bigint;
      timestamp: bigint;
    }>;
    
    return testerPayments.map(payment => ({
      id: payment.id,
      taskId: payment.taskId,
      receiver: payment.receiver,
      amount: payment.amount,
      timestamp: payment.timestamp
    }));
  } catch (error) {
    console.error('Error getting tester payments:', error);
    throw error;
  }
}

// ────────────────────────────────
// Contract State Read Functions
// ────────────────────────────────

/**
 * Get the cUSD token address
 */
export async function getCUSDToken() {
  try {
    const cUSDToken = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'cUSDToken',
      args: []
    });
    return cUSDToken as `0x${string}`;
  } catch (error) {
    console.error('Error getting cUSD token address:', error);
    throw error;
  }
}

/**
 * Get the agent address
 */
export async function getAgent() {
  try {
    const agent = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'agent',
      args: []
    });
    return agent as `0x${string}`;
  } catch (error) {
    console.error('Error getting agent address:', error);
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

/**
 * Check if the contract is paused
 */
export async function isPaused() {
  try {
    const paused = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'paused',
      args: []
    });
    return paused as boolean;
  } catch (error) {
    console.error('Error checking if paused:', error);
    throw error;
  }
}

// ────────────────────────────────
// Utility Functions
// ────────────────────────────────

/**
 * Get contract balance in cUSD
 */
export async function getContractBalance() {
  try {
    const cUSDToken = await getCUSDToken();
    const balance = await publicClient.readContract({
      address: cUSDToken,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ],
      functionName: 'balanceOf',
      args: [contractAddress]
    });
    return balance as bigint;
  } catch (error) {
    console.error('Error getting contract balance:', error);
    throw error;
  }
}

/**
 * Get multiple tasks in batch
 */
export async function getMultipleTasks(startId: bigint, count: bigint) {
  try {
    const tasks = [];
    for (let i = 0; i < count; i++) {
      try {
        const taskId = startId + BigInt(i);
        const task = await getTask(taskId);
        tasks.push(task);
      } catch (error) {
        // Task doesn't exist, skip
        break;
      }
    }
    return tasks;
  } catch (error) {
    console.error('Error getting multiple tasks:', error);
    throw error;
  }
}

/**
 * Get tester's total earnings across all tasks
 */
export async function getTesterTotalEarnings(testerAddress: `0x${string}`) {
  try {
    const testerInfo = await getTesterInfo(testerAddress);
    return testerInfo.totalEarned;
  } catch (error) {
    console.error('Error getting tester total earnings:', error);
    throw error;
  }
}

/**
 * Get all tasks for a specific tester
 */
export async function getTesterTasks(testerAddress: `0x${string}`) {
  try {
    const testerInfo = await getTesterInfo(testerAddress);
    const tasks = [];
    
    for (const taskId of testerInfo.taskIds) {
      try {
        const task = await getTask(taskId);
        const earnings = await getTesterTaskEarnings(testerAddress, taskId);
        tasks.push({
          ...task,
          earnings
        });
      } catch (error) {
        console.warn(`Error getting task ${taskId}:`, error);
      }
    }
    
    return tasks;
  } catch (error) {
    console.error('Error getting tester tasks:', error);
    throw error;
  }
}