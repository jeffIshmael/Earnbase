'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Pending, Award } from 'lucide-react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import BottomNavigation from '@/components/BottomNavigation';

export default function HistoryPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h1>
          <p className="text-gray-600">
            Please connect your wallet to view your task history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-indigo-100 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Task History</h1>
            <p className="text-sm text-gray-600">Your participation journey</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">History Coming Soon</h3>
          <p className="text-gray-600">Your task participation history will appear here.</p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
} 