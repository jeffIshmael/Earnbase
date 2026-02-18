'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Award, ArrowLeft, Search, Filter } from 'lucide-react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import BottomNavigation from '@/components/BottomNavigation';
import { getUserSubmissions } from '@/lib/Prismafnctns';

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      getUserSubmissions(address)
        .then(data => {
          setSubmissions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching submissions:", err);
          setLoading(false);
        });
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-celo-lt-tan flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black p-8 max-w-md w-full text-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
        >
          <div className="w-20 h-20 bg-celo-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black/10">
            <Clock className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-h3 font-gt-alpina font-bold text-black mb-4">CONNECT WALLET</h1>
          <p className="text-body-m text-celo-body font-inter mb-8">
            Connect your wallet to track your progress and view your earned rewards.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-celo-lt-tan pb-28 relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-celo-orange/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-celo-yellow/10 rounded-full blur-3xl"></div>
      </div>

      <header className="bg-celo-orange border-b-4 border-black rounded-b-3xl sticky top-0 z-50 shadow-[0_6px_0_0_rgba(0,0,0,1)]">
        <div className="px-6 py-5 flex items-center space-x-4">
          <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            <Clock className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-h4 font-gt-alpina font-bold text-black truncate tracking-tight">
              YOUR HISTORY
            </h1>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-celo-success rounded-full animate-pulse"></span>
              <p className="text-eyebrow font-inter text-black/70 uppercase tracking-widest leading-none">
                Earning Journey
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-black border-t-celo-orange rounded-full animate-spin mb-4"></div>
            <p className="font-inter font-heavy uppercase tracking-widest text-celo-body">Fetching History...</p>
          </div>
        ) : submissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-6"
          >
            <div className="w-24 h-24 bg-celo-lt-tan border-4 border-black mx-auto mb-6 flex items-center justify-center rotate-3">
              <Search className="w-12 h-12 text-black" />
            </div>
            <h3 className="text-h3 font-gt-alpina font-bold text-black mb-2">NO TASKS YET</h3>
            <p className="text-body-m text-celo-body font-inter mb-8">
              You haven&apos;t participated in any tasks yet. Head over to Home to start earning USDC!
            </p>
            <button
              onClick={() => router.push('/Start')}
              className="bg-celo-orange text-black border-2 border-black font-inter font-heavy px-8 py-3 rounded-xl hover:bg-black hover:text-celo-orange transition-all active:scale-95"
            >
              BROWSE TASKS
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border-4 border-black p-5 flex flex-col space-y-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                  onClick={() => router.push(`/Task/${submission.taskId}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-h5 font-gt-alpina font-bold text-black mb-1 truncate">
                        {submission.task.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 border-2 border-black text-[10px] font-inter font-heavy uppercase ${submission.status === 'REWARDED' ? 'bg-celo-success/20 text-celo-success' :
                          submission.status === 'PENDING' ? 'bg-celo-yellow text-black' : 'bg-red-100 text-red-600'
                          }`}>
                          {submission.status}
                        </span>
                        <p className="text-[10px] text-celo-body font-inter uppercase">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-h4 font-gt-alpina font-bold text-black">
                        {submission.reward ? (Number(submission.reward) / 1000000).toFixed(2) : "0.00"}
                      </p>
                      <p className="text-[10px] font-inter font-heavy text-celo-body">USDC EARNED</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
