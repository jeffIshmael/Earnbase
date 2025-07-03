'use client';

import { useState } from 'react';
import { ArrowLeft, Clock, Users, Trophy, Gift, CheckCircle, Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetails {
  id: string;
  title: string;
  description: string;
  reward: string;
  timeRemaining: string;
  participants: number;
  difficulty: string;
  progress: number;
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    reward: string;
  }>;
  leaderboard: Array<{
    rank: number;
    username: string;
    points: number;
    avatar: string;
  }>;
  totalEarnings: string;
  claimableRewards: string;
}

const taskDetails: TaskDetails = {
  id: '1',
  title: 'Watch Educational Video',
  description: 'Watch a series of educational videos about DeFi and blockchain technology to earn rewards.',
  reward: '0.5 cUSD',
  timeRemaining: '2d 14h',
  participants: 1234,
  difficulty: 'Easy',
  progress: 65,
  subtasks: [
    { id: '1', title: 'Introduction to DeFi', completed: true, reward: '0.1 cUSD' },
    { id: '2', title: 'Understanding Smart Contracts', completed: true, reward: '0.1 cUSD' },
    { id: '3', title: 'Yield Farming Basics', completed: false, reward: '0.15 cUSD' },
    { id: '4', title: 'Risk Management', completed: false, reward: '0.15 cUSD' },
  ],
  leaderboard: [
    { rank: 1, username: 'CryptoMaster', points: 2500, avatar: '🏆' },
    { rank: 2, username: 'DeFiExplorer', points: 2350, avatar: '🥈' },
    { rank: 3, username: 'BlockchainPro', points: 2200, avatar: '🥉' },
    { rank: 4, username: 'TokenTrader', points: 2100, avatar: '⭐' },
    { rank: 5, username: 'SmartInvestor', points: 2000, avatar: '💎' },
  ],
  totalEarnings: '0.2 cUSD',
  claimableRewards: '0.2 cUSD'
};

const TaskPage = ({ taskId }: { taskId:string }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'leaderboard' | 'earnings'>('tasks');

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-md';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md';
      default:
        return 'bg-white border border-gray-200 text-gray-700 shadow-sm';
    }
  };

  const getDifficultyColor = () => {
    switch (taskDetails.difficulty) {
      case 'Easy':
        return 'bg-emerald-100 text-emerald-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800';
      case 'Hard':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-indigo-100 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{taskDetails.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={cn(
                'text-xs px-2 py-1 rounded-full',
                getDifficultyColor()
              )}>
                {taskDetails.difficulty}
              </span>
              <span className="text-sm text-gray-600">{taskDetails.reward}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Overview */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{taskDetails.title}</h2>
            <p className="text-gray-600 mb-4">{taskDetails.description}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                <span>{taskDetails.timeRemaining}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4" />
                <span>{taskDetails.participants.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">{taskDetails.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${taskDetails.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { key: 'tasks', label: 'Tasks', icon: CheckCircle },
              { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { key: 'earnings', label: 'Earnings', icon: Gift },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-2 py-4 px-3 font-medium transition-all duration-200',
                  activeTab === key
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'tasks' && (
              <div className="space-y-3">
                {taskDetails.subtasks.map((subtask, index) => (
                  <div
                    key={subtask.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group',
                      subtask.completed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-gray-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        subtask.completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'
                      )}>
                        {subtask.completed ? <CheckCircle className="w-4 h-4" /> : (index + 1)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{subtask.title}</h4>
                        <p className="text-sm font-semibold text-emerald-600">{subtask.reward}</p>
                      </div>
                    </div>
                    {subtask.completed ? (
                      <div className="text-emerald-500">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-3">
                {taskDetails.leaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                      user.rank <= 3 ? "border-2" : "border"
                    )}
                    style={{
                      borderColor: user.rank === 1 ? "rgba(234, 179, 8, 0.5)" : 
                                    user.rank === 2 ? "rgba(209, 213, 219, 0.5)" : 
                                    user.rank === 3 ? "rgba(249, 115, 22, 0.5)" : "#e5e7eb"
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                        getRankColor(user.rank)
                      )}>
                        {user.rank <= 3 ? user.avatar : user.rank}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{user.username}</h4>
                        <p className="text-sm text-gray-600">{user.points.toLocaleString()} points</p>
                      </div>
                    </div>
                    {user.rank <= 3 && (
                      <Star className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Earnings</h3>
                    <p className="text-3xl font-bold">{taskDetails.totalEarnings}</p>
                    <p className="text-emerald-100 text-sm mt-1">From this task</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-amber-800">Claimable Rewards</h4>
                    <span className="text-amber-700 font-bold">{taskDetails.claimableRewards}</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-4">
                    You have completed 2 out of 4 subtasks. Complete more to earn additional rewards!
                  </p>
                  <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]">
                    Claim Rewards
                  </button>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold text-indigo-800 mb-2">Bonus Opportunities</h4>
                  <p className="text-sm text-indigo-700 mb-3">
                    Complete all subtasks to unlock a 50% bonus reward!
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        Bonus: +0.25 cUSD
                      </span>
                    </div>
                    <div className="text-sm text-indigo-600 font-medium">
                      2/4 completed
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskPage;