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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-gray to-indigo-100 flex items-center justify-center p-4">
      <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.5}
        />
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg text-center border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reward Claimed! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your valuable feedback! Your contribution helps make ChamaPay better.
          </p>
          <button
            onClick={handleGoBack}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Return to Tasks
          </button>
        </div>
      </div>
  )
}

export default Congrats