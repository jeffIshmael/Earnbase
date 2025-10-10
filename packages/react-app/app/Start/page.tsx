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
        return 'bg-celo-success text-white border-2 border-black';
      case 'Medium':
        return 'bg-celo-orange text-black border-2 border-black';
      case 'Hard':
        return 'bg-celo-error text-white border-2 border-black';
      default:
        return 'bg-celo-inactive text-white border-2 border-black';
    }
  };

  const ConnectButton = () => (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0.5 h-6 bg-black" />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-celo-yellow border-2 border-black" />
      
      <button
        onClick={handleConnect}
        className="bg-celo-yellow hover:bg-black hover:text-celo-yellow text-black border-4 border-black font-inter font-heavy py-3 px-6 transition-all duration-200 flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        <span>CONNECT WALLET</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-celo-lt-tan">
      <div className="mb-24">
        {/* Simple Header */}
        <div className="bg-celo-yellow border-b-4 border-black px-6 py-6 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
               <Image src="/logo.png" alt="EarnBase" width={40} height={40} className="object-contain border-2 border-black" />
              </div>
              <div>
                <h1 className="text-h2 font-gt-alpina font-thin text-black">EARNBASE</h1>
              </div>
            </div>
        
            {!isConnected && <ConnectButton />}
          </div>
        </div>
        {/* Welcome Section */}
        {isConnected && (
          <div className="mx-6 mt-6 bg-white border-4 border-black p-6">
            <div className="text-center">
              <p className="text-body-s text-celo-body mb-3 font-inter font-heavy">YOUR TOTAL EARNBASE EARNINGS</p>
              {statsLoading ? (
                <div className="h-12 bg-celo-dk-tan animate-pulse"></div>
              ) : (
                <p className="text-h2 font-gt-alpina font-thin text-black">{userStats.totalEarned}</p>
              )}
            </div>
          </div>
        )}
        
             {/* Self Protocol Verification Warning */}
        <div className="mx-6 mt-6">
          <div className="bg-celo-orange border-4 border-black p-6">
            <div className="flex items-start space-x-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-body-s font-inter font-heavy text-black">SELF PROTOCOL INTEGRATION</h3>
            <div className="px-3 py-1 bg-black text-celo-orange text-eyebrow font-inter font-heavy">
              NEW
            </div>
          </div>
          <p className="text-body-s text-black font-inter">
            We&apos;ve integrated <span className="font-heavy">Self Protocol</span> to give task creators the option
            to set requirements (e.g., age, gender, country).
            Some tasks may require quick verification through Self before you can participate.
          </p>
        </div>
            </div>
          </div>
        </div>
        {/* Tasks Section */}
        <div className="px-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-h4 font-gt-alpina font-thin text-black">AVAILABLE TASKS</h3>
            <button 
              onClick={() => router.push('/Marketplace')}
              className="text-celo-purple text-body-s font-inter font-heavy flex items-center gap-2 hover:text-black transition-colors"
            >
              VIEW ALL
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border-4 border-black p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-celo-dk-tan flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-5 bg-black mb-3 w-3/4"></div>
                          <div className="h-4 bg-celo-body"></div>
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="h-5 bg-black mb-2 w-20"></div>
                        <div className="h-4 bg-celo-body w-24"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-celo-body w-24"></div>
                      <div className="h-4 bg-celo-body w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-celo-body text-body-m font-inter">
                NO TASKS AVAILABLE
              </div>
            ) : null}
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => router.push(`/Task/${task.id}`)}
                className="bg-white border-4 border-black p-6 hover:bg-celo-dk-tan transition-all duration-200 active:scale-98 cursor-pointer"
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="p-3 bg-celo-purple border-2 border-black flex-shrink-0">
                      {(() => {
                        const iconInfo = { iconType: 'trending', iconColor: 'text-white' };
                        if (task.title.toLowerCase().includes('tech') || task.title.toLowerCase().includes('career')) {
                          iconInfo.iconType = 'users';
                          iconInfo.iconColor = 'text-white';
                        } else if (task.title.toLowerCase().includes('health') || task.title.toLowerCase().includes('fitness')) {
                          iconInfo.iconType = 'shield';
                          iconInfo.iconColor = 'text-white';
                        }
                        return renderTaskIcon(iconInfo.iconType, iconInfo.iconColor);
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 min-w-0">
                        <h4 className="font-gt-alpina font-thin text-black text-body-l truncate flex-1">{task.title}</h4>
                        {task.restrictionsEnabled && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <ShieldCheck className="w-4 h-4 text-celo-success" />
                          </div>
                        )}
                      </div>
                      <p className="text-body-s text-celo-body font-inter line-clamp-2">{task.description}</p>
                    </div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="font-gt-alpina font-thin text-celo-purple text-body-l">{formatReward(task.baseReward)}</p>
                    <p className="text-body-s text-celo-body font-inter">{getTimeLeft(task.expiresAt as Date)}</p>
                  </div>
                </div>
                {/* Task Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-2 text-body-s text-celo-body font-inter">
                      <Users className="w-4 h-4" />
                      {task.currentParticipants}/{task.maxParticipants}
                    </div>
                  </div>
                  {/* Verification Badge for Premium Tasks */}
                  {task.restrictionsEnabled && !isVerified && (
                    <div className="flex items-center gap-2 text-body-s text-celo-orange bg-celo-orange bg-opacity-20 px-3 py-1 border-2 border-celo-orange">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-inter font-heavy">VERIFY REQUIRED</span>
                    </div>
                  )}
                  {(!task.restrictionsEnabled || isVerified) && (
                    <ArrowRight className="w-5 h-5 text-celo-body" />
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