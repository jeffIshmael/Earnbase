'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isInterfaceReady, setIsInterfaceReady] = useState(false);
  const router = useRouter();

  // Initialize Farcaster Frame
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
    <div className="min-h-screen bg-celo-lt-tan relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-celo-yellow/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-celo-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-celo-forest/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Mobile-caged container */}
      <div className="max-w-sm mx-auto min-h-screen flex flex-col">
        
        {/* Hero Section */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-16 text-center">
          
          {/* Sub Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 border-4 border-black bg-celo-forest text-white text-eyebrow font-inter font-heavy mb-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
          >
            <Sparkles className="w-4 h-4 mr-2 text-white" />
            POWERED BY AI + ONCHAIN REWARDS
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-h1 font-gt-alpina font-thin leading-tight mb-6 tracking-tight"
          >
            Get Paid for Sharing <br />
            <span className="text-celo-purple italic font-light">Smart Feedback</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-body-l text-celo-body mb-12 font-inter leading-relaxed"
          >
            Earn tokens by submitting insights on platform tasks. Our AI measures the value of your ideas — the sharper your feedback, the higher your rewards.
          </motion.p>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 w-full mb-12"
          >
            {[
              "AI-powered feedback scoring",
              "Higher value = higher rewards", 
              "Instant crypto payouts",
              "Farcaster + MetaMask supported"
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-start space-x-3 bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all duration-200"
              >
                <CheckCircle className="w-6 h-6 text-celo-success mt-1 flex-shrink-0" />
                <span className="text-body-m font-inter font-heavy">{feature}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.button
            onClick={() => router.push('/Start')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-celo-yellow hover:bg-black hover:text-celo-yellow text-black border-4 border-black text-body-l font-inter font-heavy shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all duration-300 flex items-center gap-3"
          >
            START EARNING NOW
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Footer */}
        <footer className="text-center text-body-s text-celo-body py-8 font-inter border-t-4 border-black bg-white">
          © {new Date().getFullYear()} <span className="font-heavy">EARNBASE</span> — YOUR INSIGHT. YOUR VALUE.
        </footer>
      </div>
    </div>
  );
}
