'use client';

import React from 'react';
import { ArrowLeft, Trophy, Award, BarChart2, Calendar, Gift } from 'lucide-react';

const Task6Form = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-sm border border-gray-100">
        {/* Header with back button */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white relative">
          <button 
            onClick={handleGoBack}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-8">
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-6 h-6" />
              <h1 className="text-xl font-bold">Final Day Wrap-Up</h1>
            </div>
            <p className="text-indigo-100 text-sm mt-1">
              Celebrating our beta testers
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <Calendar className="flex-shrink-0 text-blue-600 mt-0.5" />
            <p className="text-sm text-gray-700">
              The ChamaPay Beta Testing officially ends on <span className="font-semibold text-blue-700">July 28th, 2025</span>.
            </p>
          </div>

          <p className="text-gray-700">
            As we wrap up this incredible journey, we'll be celebrating the top contributors!
          </p>

          {/* Rewards Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Top Tester Rewards</h3>
                <ul className="space-y-3 mt-3">
                  <li className="flex items-center gap-3">
                    <div className="bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center">
                      <span className="text-yellow-800 font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">1st Place</p>
                      <p className="text-emerald-600 font-bold">5 cUSD</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">2nd Place</p>
                      <p className="text-emerald-600 font-bold">3 cUSD</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-amber-100 w-8 h-8 rounded-full flex items-center justify-center">
                      <span className="text-amber-800 font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">3rd Place</p>
                      <p className="text-emerald-600 font-bold">2 cUSD</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Your Position */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Your Position</h3>
                <p className="text-sm text-amber-700 mt-2">
                  You&apos;re currently ranked <span className="font-bold text-indigo-800">#7</span> on the leaderboard.
                </p>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Top 3 Leaderboard</h3>
                <ul className="mt-3 space-y-3">
                  <li className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-100 w-6 h-6 rounded-full flex items-center justify-center">
                        <span className="text-yellow-800 text-xs font-bold">1</span>
                      </div>
                      <span className="font-medium">CryptoMaster</span>
                    </div>
                    <span className="text-emerald-600 font-bold">25 cUSD</span>
                  </li>
                  <li className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-200 w-6 h-6 rounded-full flex items-center justify-center">
                        <span className="text-gray-700 text-xs font-bold">2</span>
                      </div>
                      <span className="font-medium">DeFiExplorer</span>
                    </div>
                    <span className="text-emerald-600 font-bold">23 cUSD</span>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 w-6 h-6 rounded-full flex items-center justify-center">
                        <span className="text-amber-800 text-xs font-bold">3</span>
                      </div>
                      <span className="font-medium">BlockchainPro</span>
                    </div>
                    <span className="text-emerald-600 font-bold">21 cUSD</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Thank You */}
          <div className="text-center bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <p className="text-sm text-indigo-700">
              Thank you for participating in the ChamaPay Beta Program. Your feedback and dedication have helped us improve the platform!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Task6Form;