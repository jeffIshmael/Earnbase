"use server";

import { createPublicClient, http } from 'viem';
import { erc20Abi } from 'viem';
import { celo, base } from 'viem/chains';
import { celoAddress, cUSDAddress, USDCAddress } from '@/blockchain/constants';

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
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const USDCBalance = await celoClient.readContract({
    address: USDCAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const celoBalance = await celoClient.readContract({
    address: celoAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return { cUSDBalance, USDCBalance, celoBalance };
}
