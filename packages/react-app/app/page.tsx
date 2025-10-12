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
    <div className="min-h-screen flex flex-col bg-celo-lt-tan">
      
      {/* Centered Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-2xl mx-auto">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center px-6 py-2 border-2 border-black bg-celo-yellow text-black text-body-s font-inter font-heavy mb-6"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          POWERED BY AI & ONCHAIN REWARDS
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-h1 font-gt-alpina font-thin text-black mb-6"
        >
          GET PAID FOR SHARING <span className="text-celo-purple italic">SMART FEEDBACK</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-body-l text-celo-body mb-10 font-inter"
        >
          Earn tokens by submitting feedback on platform tasks. Our AI scores the value of your input — the better your insight, the higher the payout.
        </motion.p>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left w-full max-w-lg mb-12"
        >
          {[
            "AI-reviewed feedback scoring",
            "Higher value = higher rewards",
            "Instant crypto payouts",
            "Farcaster + MetaMask supported"
          ].map((feature, i) => (
            <div key={i} className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-celo-success mt-1 flex-shrink-0" />
              <span className="text-body-m text-black font-inter">{feature}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          onClick={() => router.push('/Start')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-8 py-4 bg-celo-yellow hover:bg-black hover:text-celo-yellow text-black border-4 border-black text-body-l font-inter font-heavy transition-all duration-200 flex items-center gap-3"
        >
          START EARNING NOW
          <ArrowRight className="w-5 h-5" />
        </motion.button>

      </div>

      {/* Footer */}
      <footer className="text-center text-body-s text-celo-body py-8 font-inter">
        © {new Date().getFullYear()} EARNBASE — YOUR INSIGHT. YOUR VALUE.
      </footer>
    </div>
  );
}