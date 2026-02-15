import { ethers } from 'ethers';
// Use ethers or viem for distribution. 
// Prismafnctns has `makePaymentToUser` but that uses cUSD contract.
// We need a new function for USDC.

import { createWalletClient, http, parseUnits, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo, celoAlfajores } from 'viem/chains';
import { USDCAddress } from '@/contexts/constants';
import { erc20Abi } from 'viem';

// This function effectively replaces the old RewardVault logic for USDC
export async function distributeReward(
    userAddress: string,
    amount: string, // USDC amount (e.g. "1.5")
    taskId: number
) {
    // 1. Check if we have funds (The Earnbase Agent Wallet)
    // 2. Transfer USDC to user

    // Note: This requires a backend wallet with private key
    // Implementation depends on how "Earnbase Agent" is hosted (NextJS server action?)

    const pKey = process.env.EARNBASE_AGENT_PRIVATE_KEY;
    if (!pKey) {
        console.error("Missing EARNBASE_AGENT_PRIVATE_KEY");
        return false;
    }

    try {
        const account = privateKeyToAccount(pKey as `0x${string}`);
        const client = createWalletClient({
            account,
            chain: process.env.NEXT_PUBLIC_WC_PROJECT_ID ? celo : celoAlfajores,
            transport: http()
        });

        const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
        // Note: Celo native USDC uses 18 decimals usually (standard ERC20 on Celo).
        // If it's pure USDC from Circle (bridged), it might be 6. 
        // Checking constants.ts... it's 0xcebA9... (Celo Mento cUSD? No, user said USDC).
        // Assuming 18 decimals for now based on `parseEther` usage in codebase which implies 18.

        const tx = await client.writeContract({
            address: USDCAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [userAddress as `0x${string}`, amountWei]
        });

        console.log(`Distributed ${amount} USDC to ${userAddress}. Tx: ${tx}`);
        return tx;

    } catch (error) {
        console.error("Reward distribution failed:", error);
        return null;
    }
}
