'use client';

import React from 'react';
import { ArrowLeft, Gift, Users, Share2, MessageSquare, Award, Zap } from 'lucide-react';
import { toast } from 'sonner';

const Task4Form = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  // function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('copied');
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
              <h1 className="text-xl font-bold">Additional Rewards</h1>
            </div>
            <p className="text-indigo-100 text-sm mt-1">
              Earn extra rewards through your participation
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-700">
            The ChamaPay Beta Program doesn't stop at completing tasks — you can earn even more through your actions and consistency!
          </p>

          <div className="space-y-4">
            {/* Group Participation */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Group Participation</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1.5 ml-5">
                    <li>Earn <span className="font-semibold text-indigo-700">1 cUSD</span> for every successful group payout</li>
                    <li>Earn an extra <span className="font-semibold text-indigo-700">2 cUSD</span> once everyone completes a full cycle</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Referral Rewards */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Share2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Referral Rewards</h3>
                  <p className="text-sm text-gray-700 mt-2">
                    Create your own group using coupon code <span onClick={()=> copyToClipboard("CPBS001")} className="bg-gray-100 px-2 py-0.5 rounded text-indigo-700 font-mono text-xs">CPBS001</span>. Earn <span className="font-semibold text-green-700">0.2 cUSD</span> per member who joins.
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback Bonus */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Feedback Bonus</h3>
                  <p className="text-sm text-gray-700 mt-2">
                    Earn up to <span className="font-semibold text-blue-700">1 cUSD</span> extra based on feedback quality (AI-rated), on top of the regular <span className="font-semibold">2 cUSD</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Leaderboard Bonus */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Leaderboard Bonus</h3>
                  <p className="text-sm text-gray-700 mt-2">
                    Top testers earn extra rewards:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-700 mt-1.5 space-y-1 ml-5">
                    <li><span className="font-semibold text-purple-700">🥇 5 cUSD</span> for 1st place</li>
                    <li><span className="font-semibold text-purple-700">🥈 3 cUSD</span> for 2nd place</li>
                    <li><span className="font-semibold text-purple-700">🥉 2 cUSD</span> for 3rd place</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Tips to Rank High</h3>
                <ul className="list-disc list-inside text-sm text-amber-700 mt-2 space-y-1.5 ml-5">
                  <li>Submit detailed, valuable feedback regularly</li>
                  <li>Maintain consistent daily Chama payments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Task4Form;