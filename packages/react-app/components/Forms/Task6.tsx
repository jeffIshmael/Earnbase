'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Award, BarChart2, Calendar, Gift } from 'lucide-react';
import { useAccount } from 'wagmi';
// Mock leaderboard data since getTestersLeaderboard doesn't exist
const mockLeaderboardData = [
  { userName: 'Alice Johnson', walletAddress: '0x1234...5678', totalEarned: 25.5 },
  { userName: 'Bob Smith', walletAddress: '0x8765...4321', totalEarned: 22.0 },
  { userName: 'Carol Davis', walletAddress: '0x1111...2222', totalEarned: 18.5 },
  { userName: 'David Wilson', walletAddress: '0x3333...4444', totalEarned: 15.0 },
  { userName: 'Eva Brown', walletAddress: '0x5555...6666', totalEarned: 12.5 },
]; 
import { formatEther } from 'viem';

interface LeaderboardUser {
  userName: string;
  walletAddress: string;
  totalEarned: number;
}

const Task6Form = () => {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const handleGoBack = () => window.history.back();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Use mock data instead of API call
        const data = mockLeaderboardData;
        const leaderboardData = data.map((u) => ({
          ...u,
          totalEarned: u.totalEarned,
        }));
        setLeaderboard(leaderboardData);

        if (address) {
          const rank = data.findIndex((u) => u.walletAddress.toLowerCase() === address.toLowerCase());
          if (rank !== -1) {
            setUserRank(rank + 1); // ranks start from 1
          }
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [address]);

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-sm border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white relative">
          <button onClick={handleGoBack} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-8">
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-6 h-6" />
              <h1 className="text-xl font-bold">Final Day Wrap-Up</h1>
            </div>
            <p className="text-indigo-100 text-sm mt-1">Celebrating our beta testers</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* End Date Notice */}
          <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <Calendar className="flex-shrink-0 text-blue-600 mt-0.5" />
            <p className="text-sm text-gray-700">
              The ChamaPay Beta Testing officially ends on <span className="font-semibold text-blue-700">July 28th, 2025</span>.
            </p>
          </div>

          {/* Rewards Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Top Tester Rewards</h3>
                <ul className="space-y-3 mt-3">
                  {[
                    { place: '1st', reward: '5 cUSD' },
                    { place: '2nd', reward: '3 cUSD' },
                    { place: '3rd', reward: '2 cUSD' },
                  ].map(({ place, reward }, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        i === 0 ? 'bg-yellow-100 text-yellow-800'
                        : i === 1 ? 'bg-gray-200 text-gray-700'
                        : 'bg-amber-100 text-amber-800'
                      } font-bold`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{place} Place</p>
                        <p className="text-emerald-600 font-bold">{reward}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* User Rank */}
          {userRank && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800">Your Position</h3>
                  <p className="text-sm text-amber-700 mt-2">
                    You&apos;re currently ranked <span className="font-bold text-indigo-800">#{userRank}</span> on the leaderboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Top 3 Leaderboard</h3>
                {loading ? (
                  <p className="text-gray-500 mt-3">Loading...</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {top3.map((user, i) => (
                      <li key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            i === 0 ? 'bg-yellow-100 text-yellow-800'
                            : i === 1 ? 'bg-gray-200 text-gray-700'
                            : 'bg-amber-100 text-amber-800'
                          } text-xs font-bold`}>
                            {i + 1}
                          </div>
                          <span className="font-medium">{user.userName || 'Anonymous'}</span>
                        </div>
                        <span className="text-emerald-600 font-bold">{user.totalEarned.toFixed(2)} cUSD</span>
                      </li>
                    ))}
                  </ul>
                )}
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
