'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isInterfaceReady, setIsInterfaceReady] = useState(false);
  const router = useRouter();

  // Minimal Farcaster frame-ready
  useEffect(() => {
    setIsInterfaceReady(true);
  }, []);

  useEffect(() => {
    const setReady = async () => {
      if (isInterfaceReady) {
        try {
          await sdk.actions.ready();
          await sdk.actions.addFrame();
        } catch (err) {
          console.warn("Not in Farcaster:", err);
        }
      }
    };
    setReady();
  }, [isInterfaceReady]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-indigo-100 to-purple-100">
      
      {/* Centered Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-2xl mx-auto">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Powered by AI & Onchain Rewards
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4"
        >
          Get Paid for Sharing <span className="text-indigo-600">Smart Feedback</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 mb-8"
        >
          Earn tokens by submitting feedback on platform tasks. Our AI scores the value of your input — the better your insight, the higher the payout.
        </motion.p>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full max-w-md mb-10"
        >
          {[
            "AI-reviewed feedback scoring",
            "Higher value = higher rewards",
            "Instant crypto payouts",
            "Farcaster + MetaMask supported"
          ].map((feature, i) => (
            <div key={i} className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          onClick={() => router.push('/Start')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-medium rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          Start Earning Now
          <ArrowRight className="w-4 h-4" />
        </motion.button>

      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 py-6">
        © {new Date().getFullYear()} EarnBase — Your Insight. Your Value.
      </footer>
    </div>
  );
}