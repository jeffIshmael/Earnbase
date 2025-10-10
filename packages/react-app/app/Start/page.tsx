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
import { useRouter } from 'next/navigation';
import { getAllActiveTasks, TaskWithEligibility, renderTaskIcon, getTasksWithEligibility, formatReward, getTimeLeft } from '@/lib/taskService';
import { useAccount, useSwitchChain, useConnect } from 'wagmi';
import { useIsFarcaster } from '../context/isFarcasterContext';
import { sdk } from "@farcaster/miniapp-sdk";
import { injected } from 'wagmi/connectors';
import { celo } from 'wagmi/chains';
import { getUser, getUserSubmissions, registerUser } from '@/lib/Prismafnctns';
import { toast } from 'sonner';
import Image from 'next/image';
import {updateEarnings} from '@/lib/Prismafnctns';


interface User {
  fid: number;
  username?: string;
  displayName?: string;
}

const MobileEarnBaseHome = () => {
  // Simulating connected state
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(true);
  const [userStats, setUserStats] = useState({
    totalEarned: '0.00',
    tasksCompleted: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskWithEligibility[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const { isFarcaster, setIsFarcaster } = useIsFarcaster();
  const [fcDetails, setFcDetails] = useState<User | null>(null);
  const { connect, connectors } = useConnect();
  const { switchChain, isPending } = useSwitchChain();
  const [showNetworkSwitch, setShowNetworkSwitch] = useState(false);
  const [farcasterChecked, setFarcasterChecked] = useState(false);


  // checkUserRegistered effect
  useEffect(() => {
    const checkUserRegistered = async () => {
      if (
        !address ||
        !isConnected ||
        !farcasterChecked ||
        (isFarcaster && !fcDetails)
      ) {
        return;
      }

      try {
        const user = await getUser(address);
        if (!user && isFarcaster && farcasterChecked && fcDetails) {
          await registerUser(
            fcDetails.username ?? "anonymous",
            fcDetails.fid,
            address as string,
            null
          );
          return;
        } else if (!user) {
          await registerUser(
            "anonymous",
            null,
            address as string,
            null
          );
        }
      } catch (err) {
        console.error("Error checking user:", err);
      }
    };

    checkUserRegistered();
  }, [address, isConnected, isFarcaster, farcasterChecked]);


    // Farcaster detection useEffect
    useEffect(() => {
      const getContext = async () => {
        try {
          const context = await sdk.context;
          if (context?.user) {
            setIsFarcaster(true);
            setFcDetails({
              fid: context.user.fid,
              username: context.user.username,
              displayName: context.user.displayName,
            });
            connect({ connector: connectors[1] }); // connect Farcaster wallet
          } else {
            setIsFarcaster(false);
          }
        } catch (err) {
          console.error("Failed to get Farcaster context", err);
          setIsFarcaster(false);
        } finally {
          setFarcasterChecked(true); // now it's safe to run checkUser
        }
      };
  
      getContext();
    }, []);
  
    useEffect(() => {
      if (isFarcaster) return;
      if (window.ethereum?.isMiniPay) {
        connect({ connector: injected({ target: "metaMask" }) });
      }
    }, [isFarcaster]); // Only run when isFarcaster changes
  

  useEffect(() => {
    // Load tasks from database
    const loadTasks = async () => {
      try {
        setLoading(true);
        const activeTasks = await getAllActiveTasks();
        setTasks(activeTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  // Load user stats from database
  useEffect(() => {
    const loadUserStats = async () => {
      if (!address || !isConnected) return;
      
      try {
        setStatsLoading(true);
        const user = await getUser(address);
        if (user) {
          // Get user's task submissions to calculate stats
          const userSubmissions = await getUserSubmissions(address);
          const completedTasks = userSubmissions.filter(sub => sub.status === 'APPROVED').length;
          
          // Calculate total earned (this would come from blockchain in real app)
          const totalEarned = user.totalEarned ? 
            (Number(user.totalEarned) / Math.pow(10, 18)).toFixed(2) : '0.00';
          
          setUserStats({
            totalEarned: `${totalEarned} cUSD`,
            tasksCompleted: completedTasks
          });
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    loadUserStats();
  }, [address, isConnected]);

  useEffect(() => {
    if (chain?.id !== celo.id) {
      switchChain({ chainId: celo.id });
    }
  }, [chain, isConnected]);

  const handleConnect = async () => {
    try {
      if (isFarcaster) {
        connect({ connector: connectors[1] });
      } else {
        connect({ connector: injected({ target: "metaMask" }) });
      }
    } catch (error) {
      console.error(error);
      toast.error("Connection failed");
    }
  };



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
        onClick={handleConnect}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 hover:shadow-xl transition-all duration-200"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-24">
        {/* Simple Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div>
               <Image src="/logo.png" alt="EarnBase" width={40} height={40} className="object-contain rounded-full" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-gray-900 tracking-tight text-center" style={{
                  fontFamily: "'Licorice', cursive",
                  fontSize: '2.5rem',
                  fontWeight: '400',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                  letterSpacing: '0.02em'
                }}>EarnBase</h1>
              </div>
            </div>
        
            {!isConnected && <ConnectButton />}
          </div>
        </div>
        {/* Welcome Section */}
        {isConnected && (
          <div className="mx-4 mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-200 shadow-sm">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2 font-medium">Your total earnbase earnings</p>
              {statsLoading ? (
                <div className="h-8 bg-indigo-100 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-700">{userStats.totalEarned}</p>
              )}
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
            <h3 className="text-lg font-semibold text-gray-900">Available Tasks</h3>
            <button 
              onClick={() => router.push('/Marketplace')}
              className="text-indigo-500 text-sm font-medium flex items-center gap-1 hover:text-indigo-700 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-500">
                No tasks available
              </div>
            ) : null}
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => router.push(`/Task/${task.id}`)}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 active:scale-98 cursor-pointer"
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                      {(() => {
                        const iconInfo = { iconType: 'trending', iconColor: 'text-emerald-600' };
                        if (task.title.toLowerCase().includes('tech') || task.title.toLowerCase().includes('career')) {
                          iconInfo.iconType = 'users';
                          iconInfo.iconColor = 'text-purple-600';
                        } else if (task.title.toLowerCase().includes('health') || task.title.toLowerCase().includes('fitness')) {
                          iconInfo.iconType = 'shield';
                          iconInfo.iconColor = 'text-blue-600';
                        }
                        return renderTaskIcon(iconInfo.iconType, iconInfo.iconColor);
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate flex-1">{task.title}</h4>
                        {task.restrictionsEnabled && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <ShieldCheck className="w-3 h-3 text-green-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-bold text-indigo-600 text-sm">{formatReward(task.baseReward)}</p>
                    <p className="text-xs text-gray-500">{getTimeLeft(task.expiresAt as Date)}</p>
                  </div>
                </div>
                {/* Task Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      {task.currentParticipants}/{task.maxParticipants}
                    </div>
                  </div>
                  {/* Verification Badge for Premium Tasks */}
                  {task.restrictionsEnabled && !isVerified && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      <span>Verify Required</span>
                    </div>
                  )}
                  {(!task.restrictionsEnabled || isVerified) && (
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MobileEarnBaseHome;