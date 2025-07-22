'use client'

import React, { useState } from 'react'
import { Gift, X } from 'lucide-react';
import { FeedbackRating } from './Forms/Task5';
import { baseReward } from '@/contexts/Terms';
import { useUserSmartAccount } from '@/app/hooks/useUserSmartAccount';
import { toast } from 'sonner';
import { contractAbi, contractAddress } from '@/contexts/constants';
import { parseEther } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';
import { setSmartAccount, checkIfSmartAccount } from '@/lib/Prismafnctns';
import {registrationTx} from "../lib/DivviRegistration";

interface AIResultsProps {
  aiRating: FeedbackRating;
  loading: boolean;
  changeLoading: (value: boolean) => void;
  afterSuccess: () => void;
  onClose: (amount: string) => void;
  handlePrismaRecord: (claimed: boolean, amount: string) => Promise<void>;
}

const AIResults = ({ aiRating, loading, changeLoading, afterSuccess, onClose, handlePrismaRecord }: AIResultsProps) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const {address} = useAccount();
  const {writeContractAsync} = useWriteContract();
  const bonusReward = (aiRating.rating / 10).toFixed(2);
  const totalReward = (baseReward + parseFloat(bonusReward)).toFixed(2);

  // function to set the smartaccount on bc
const setSmartAccountToBC = async (userAddress: `0x${string}`,smartAddress: string) =>{
  try {
    // 1. Add the reward to the user
    const res = await fetch('/api/add-smartAccount', {
      method: 'POST',
      body: JSON.stringify({
        userAddress: userAddress as string,
        smartAddress: smartAddress,
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  } catch (error) {
    console.log("unable to register s.a", error);
    return null;
  }

}

  const handleClaimReward = async () => {
    if (!address) {
      toast.error("Wallet not connected. Please try again.");
      return;
    }



    try {
      setIsClaiming(true);
      changeLoading(true);
      // const smartWalletRegistered = await checkIfSmartAccount(address as string);

      // if(!smartWalletRegistered){
      //   // register the smart wallet address
      //   const hash = await setSmartAccountToBC(address, smartAccount.address);
      //   if(hash){
      //     await setSmartAccount(address as string, smartAccount.address as string);
      //   }
      
      // }
      // 1. Add the reward to the user
      const res = await fetch('/api/add-reward', {
        method: 'POST',
        body: JSON.stringify({
          userAddress: address,
          amount: totalReward,
        }),
      });
  
      const data = await res.json();
      console.log("data from add reward", data);
      if (!data.success) throw new Error(data.error);

      // 2. Claim the reward
      const amountInWei = parseEther(totalReward);
      const args = [amountInWei, address];
      const hash = await writeContractAsync({
        abi: contractAbi,
        address: contractAddress,
        functionName: "claimRewards",
        args: args,
      });

      if (!hash) {
        throw new Error("Failed to claim reward");
      }
       // 3. Record in Prisma
      await handlePrismaRecord(true, totalReward);

      toast.success(`Successfully claimed ${totalReward} cUSD!`);
      afterSuccess();
    } catch (error) {
      console.error("Claiming error:", error);
      toast.error("Failed to claim reward. Please try again.");
    } finally {
      setIsClaiming(false);
      changeLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl relative border border-gray-100">
        <button
          onClick={() => onClose(totalReward)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition"
          aria-label="Close"
          disabled={loading || isClaiming}
        >
          <X className="w-8 h-8 text-gray-500" />
        </button>
        
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 mb-4">
          <Gift className="h-8 w-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Claim Your Reward!</h1>
        <p className="text-gray-600 mb-4">Thank you for your valuable feedback!</p>
        
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Base Reward:</span>
            <span className="font-bold text-indigo-600">{baseReward} cUSD</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Quality Bonus ({aiRating.rating}/10):</span>
            <span className="font-bold text-emerald-600">+{bonusReward} cUSD</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-medium">Total Reward:</span>
            <span className="font-bold text-lg text-purple-600">{totalReward} cUSD</span>
          </div>
        </div>
    
        <div className="bg-indigo-50 rounded-lg p-4 mb-4 text-left">
          <h3 className="text-sm font-medium text-indigo-800 mb-1">Quality Assessment:</h3>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full ${i < aiRating.rating ? 'bg-yellow-500' : 'bg-gray-200'}`}
                style={{ width: '10%' }}
              />
            ))}
            <span className="text-xs font-bold ml-2">{aiRating.rating}/10</span>
          </div>
          <p className="text-sm text-gray-700 italic">{aiRating.explanation}</p>
        </div>
    
        <div className="flex gap-3">
          <button
            onClick={() => onClose(totalReward)}
            className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition shadow-sm"
            disabled={loading || isClaiming}
          >
            Claim Later
          </button>
          <button
            onClick={handleClaimReward}
            disabled={ isClaiming }
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition shadow-md disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isClaiming ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Claim Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIResults;