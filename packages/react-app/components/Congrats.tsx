import React from 'react';
import {CheckCircle2} from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const Congrats = () => {
  const { width, height } = useWindowSize();
    const handleGoBack = () => {
        window.history.back();
      };
  return (
    <div className="min-h-screen bg-celo-lt-tan flex items-center justify-center p-4 relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-celo-yellow/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-celo-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-celo-forest/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.5}
        />
        <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center relative z-10">
          <div className="mx-auto flex items-center justify-center h-16 w-16 border-4 border-black bg-celo-success mb-4">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-h3 font-gt-alpina font-bold text-black mb-2 tracking-tight">REWARD CLAIMED! 🎉</h1>
          <p className="text-celo-body text-body-m mb-6 font-inter leading-relaxed">
            THANK YOU FOR YOUR VALUABLE FEEDBACK! YOUR CONTRIBUTION HELPS MAKE EARNBASE BETTER.
          </p>
          <button
            onClick={handleGoBack}
            className="w-full bg-celo-yellow hover:bg-black hover:text-celo-yellow text-black py-3 border-4 border-black font-inter font-heavy transition-all duration-200 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:scale-95"
          >
            RETURN TO TASKS
          </button>
        </div>
      </div>
  )
}

export default Congrats