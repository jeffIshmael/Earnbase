'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Award } from 'lucide-react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import BottomNavigation from '@/components/BottomNavigation';

export default function HistoryPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-celo-lt-tan flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-8 max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-celo-body mx-auto mb-4" />
          <h1 className="text-h3 font-gt-alpina font-thin text-black mb-2">CONNECT WALLET</h1>
          <p className="text-body-m text-celo-body font-inter">
            Please connect your wallet to view your task history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-celo-lt-tan pb-24">
      {/* Header */}
      <div className="bg-celo-yellow border-b-4 border-black p-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-celo-orange border-2 border-black flex items-center justify-center">
            <Clock className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-h3 font-gt-alpina font-thin text-black">TASK HISTORY</h1>
            <p className="text-body-s text-celo-body font-inter">YOUR PARTICIPATION JOURNEY</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-celo-body mx-auto mb-4" />
          <h3 className="text-h3 font-gt-alpina font-thin text-black mb-2">HISTORY COMING SOON</h3>
          <p className="text-body-m text-celo-body font-inter">Your task participation history will appear here.</p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
} 