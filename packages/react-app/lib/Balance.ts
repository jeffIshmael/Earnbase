"use server";

import { createPublicClient, http } from 'viem';
import { erc20Abi } from 'viem';
import { celo, base } from 'viem/chains';
import { cUSDAddress, USDCAddress } from '@/contexts/constants';

export async function getBalances(address: `0x${string}`) {
  const celoClient = createPublicClient({ 
    chain: celo, 
    transport: http(), 
  });

  const baseClient = createPublicClient({ 
    chain: base, 
    transport: http(), 
  });

  const cUSDBalance = await celoClient.readContract({
    address: cUSDAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const USDCBalance = await baseClient.readContract({
    address: USDCAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return { cUSDBalance, USDCBalance };
}
