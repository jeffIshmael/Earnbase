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
      <div className="min-h-screen bg-[#FFF9F3] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-black p-8 max-w-md w-full text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-3xl"
        >
          <div className="w-20 h-20 bg-celo-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black">
            <Clock className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-gt-alpina font-bold text-black mb-4 uppercase">CONNECT WALLET</h1>
          <p className="text-lg text-celo-body font-inter mb-8">
            Connect your wallet to track your progress and view your earned rewards.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F3] pb-28 relative overflow-hidden">
      {/* Decorative SVG elements for hand-drawn feel */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="absolute top-10 right-10 w-32 h-32 text-celo-orange" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
        </svg>
        <svg className="absolute bottom-20 left-10 w-24 h-24 text-celo-purple" viewBox="0 0 100 100">
          <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(15)" />
        </svg>
      </div>

      <header className="bg-celo-orange border-b-2 border-black rounded-b-[40px] sticky top-0 z-50 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] -rotate-3">
              <Clock className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-gt-alpina font-heavy text-black uppercase tracking-tight">
                ACTIVITY
              </h1>
              <p className="text-[10px] font-inter font-heavy text-black/60 uppercase tracking-widest">
                Earning Journey
              </p>
            </div>
          </div>
          <div className="w-10 h-10 bg-celo-yellow border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <Filter className="w-5 h-5 text-black" />
          </div>
        </div>
      </header>

      <div className="relative p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-black border-t-celo-yellow rounded-full animate-spin mb-4 shadow-md"></div>
            <p className="font-gt-alpina font-heavy uppercase tracking-widest text-black">Scanning the Ledger...</p>
          </div>
        ) : submissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white border-2 border-black rounded-[40px] shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-8"
          >
            <div className="w-28 h-28 bg-celo-lt-tan border-2 border-black mx-auto mb-8 flex items-center justify-center rotate-6 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              <Search className="w-14 h-14 text-black" />
            </div>
            <h3 className="text-3xl font-gt-alpina font-bold text-black mb-4 uppercase">Quiet on the Front</h3>
            <p className="text-lg text-celo-body font-inter mb-10 leading-relaxed">
              You haven&apos;t participated in any tasks yet. Head over to the Marketplace to start earning!
            </p>
            <button
              onClick={() => router.push('/Start')}
              className="w-full bg-celo-orange text-black border-2 border-black font-inter font-heavy px-8 py-5 rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all active:scale-95 active:shadow-none"
            >
              FIND NEW TASKS
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, rotate: index % 2 === 0 ? 0.5 : -0.5 }}
                  className="bg-white border-2 border-black p-6 flex flex-col space-y-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer rounded-3xl group"
                  onClick={() => router.push(`/Task/${submission.taskId}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Award className={`w-5 h-5 ${submission.status === 'REWARDED' ? 'text-celo-success' : 'text-celo-orange'}`} />
                        <h4 className="text-xl font-gt-alpina font-bold text-black group-hover:text-celo-purple transition-colors">
                          {submission.task.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 border-2 border-black text-[10px] font-inter font-heavy uppercase rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${submission.status === 'REWARDED' ? 'bg-celo-success/20 text-celo-success' :
                          submission.status === 'PENDING' ? 'bg-celo-yellow text-black' : 'bg-red-100 text-red-600'
                          }`}>
                          {submission.status}
                        </span>
                        <div className="flex items-center text-[10px] text-black/50 font-inter font-bold space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(submission.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-celo-lt-tan border-2 border-black p-2 rounded-xl shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:bg-celo-yellow transition-colors">
                        <p className="text-2xl font-gt-alpina font-heavy text-black leading-none">
                          {submission.reward ? (Number(submission.reward)).toFixed(2) : "0.00"}
                        </p>
                        <p className="text-[8px] font-inter font-heavy text-black/60 uppercase">USDC</p>
                      </div>
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
