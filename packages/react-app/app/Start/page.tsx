'use client'
import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowRight, 
  Coins, 
  TrendingUp, 
  Users, 
  Plus,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Star,
  Clock,
  X
} from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';

const MobileEarnBaseHome = () => {
  const [isConnected, setIsConnected] = useState(true); // Simulating connected state
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(true);
  const [userStats, setUserStats] = useState({
    totalEarned: '0.00',
    tasksCompleted: 0
  });

  const tasks = [
    {
      id: '1',
      title: 'Chamapay Beta Testers',
      reward: '20+ cUSD',
      difficulty: 'Easy',
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
      description: 'Test payment features and provide feedback',
      participants: 12,
      timeLeft: '2d',
      verified: true
    },
    {
      id: '2',
      title: 'DeFi Protocol Review',
      reward: '35+ cUSD',
      difficulty: 'Medium',
      icon: <Shield className="w-4 h-4 text-blue-600" />,
      description: 'Review new protocol security features',
      participants: 8,
      timeLeft: '5h',
      verified: true
    },
    {
      id: '3',
      title: 'Mobile UX Testing',
      reward: '15+ cUSD',
      difficulty: 'Easy',
      icon: <Users className="w-4 h-4 text-purple-600" />,
      description: 'Test mobile app user experience',
      participants: 23,
      timeLeft: '1d',
      verified: false
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const ConnectButton = () => (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0.5 h-6 bg-indigo-300" />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-indigo-300 rounded-full" />
      
      <button
        onClick={() => setIsConnected(true)}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 hover:shadow-xl transition-all duration-200"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">EarnBase</h1>
            </div>
          </div>
          
          {!isConnected && <ConnectButton />}
        </div>
      </div>


      {/* Welcome Section */}
      {isConnected && (
        <div className="mx-4 mt-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Welcome Back!</h2>
              <p className="text-indigo-200 text-sm">Ready to earn some rewards?</p>
            </div>
            <div className="flex items-center space-x-1">
              {isVerified ? (
                <div className="p-2 bg-green-500 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-indigo-200 text-xs mb-1">Total Earned</p>
              <p className="text-2xl font-bold">{userStats.totalEarned} cUSD</p>
            </div>
          </div>
        </div>
      )}

     {/* Self Protocol Verification Warning */}
<div className="mx-4 mt-4">
  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
    <div className="flex items-start space-x-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-amber-800">Self Protocol Integration</h3>
          <div className="px-2 py-1 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
            New
          </div>
        </div>
        <p className="text-xs text-amber-700 mb-3">
          We&apos;ve integrated <span className="font-medium">Self Protocol</span> to give task creators the option 
          to set requirements (e.g., age, gender, country).  
          Some tasks may require quick verification through Self before you can participate.
        </p>
      </div>
    </div>
  </div>
</div>


      {/* Tasks Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Available Tasks</h3>
          <button className="text-indigo-600 text-sm font-medium flex items-center gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 active:scale-98"
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
                      {task.verified && (
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-green-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="font-bold text-indigo-600 text-sm">{task.reward}</p>
                  <p className="text-xs text-gray-500">{task.timeLeft}</p>
                </div>
              </div>

              {/* Task Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                    {task.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    {task.participants}
                  </div>
                </div>

                {/* Verification Badge for Premium Tasks */}
                {task.verified && !isVerified && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    <span>Verify Required</span>
                  </div>
                )}

                {(!task.verified || isVerified) && (
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MobileEarnBaseHome;