'use client';

import { useState , use, useEffect} from 'react';
import { ArrowLeft, Clock, Users, Trophy, Gift, CheckCircle, Star, ChevronRight, BadgeInfo, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useCapabilities } from 'wagmi/experimental';
import { checkIfSmartAccount, getTesters, updateAsTasker, setSmartAccount, getTestersLeaderboard, getUser } from '@/lib/Prismafnctns';
import { useUserSmartAccount } from '@/app/hooks/useUserSmartAccount';
import { Tester } from '@/app/Start/page';
import { useAccount, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { toast } from 'sonner';
import { contractAbi, contractAddress } from '@/contexts/constants';
import { updateUnclaimed } from '@/lib/Prismafnctns';

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
    earned: number;
    avatar: string;
  }>;
  totalEarnings: string;
  claimableRewards: string;
  started:boolean;
}

interface LeaderboardTester{
  userName: string;
  totalEarned: bigint;
  walletAddress: string;
}

const taskDetails: TaskDetails = {
  id: '1',
  title: 'Chamapay beta testing',
  description: 'Perform the daily tasks and submit solid feedback.',
  reward: '20+ cUSD',
  timeRemaining: '2d 14h',
  participants: 12,
  difficulty: 'Easy',
  progress: 65,
  subtasks: [
    { id: '1', title: 'Explore the chamapay app', completed: true, reward: '' },
    { id: '2', title: 'Join your assigned chama.', completed: true, reward: '' },
    { id: '3', title: 'Daily activity', completed: false, reward: 'upto 3 cUSD' },
    { id: '4', title: 'Additional rewards', completed: false, reward:` ∞ cUSD` },
    { id: '5', title: 'Feedback & bug report', completed: false, reward: '∞ cUSD' },
    { id: '6', title: 'Final day wrap-up 🎉', completed: false, reward: '' },
  ],
  leaderboard: [
    { rank: 1, username: 'CryptoMaster', earned: 2500, avatar: '🏆' },
    { rank: 2, username: 'DeFiExplorer', earned: 2350, avatar: '🥈' },
    { rank: 3, username: 'BlockchainPro', earned: 2200, avatar: '🥉' },
    { rank: 4, username: 'TokenTrader', earned: 2100, avatar: '⭐' },
    { rank: 5, username: 'SmartInvestor', earned: 2000, avatar: '💎' },
  ],
  totalEarnings: '0.2 cUSD',
  claimableRewards: '0.2 cUSD',
  started: true,
};

const Page = ({ params }: { params: Promise<{ slug: string }>}) => {
    const { slug } = use(params);
  const [activeTab, setActiveTab] =  useState<'tasks' | 'leaderboard' | 'earnings'>('tasks');
  const [leaderboardArray, setLeaderboardArray] = useState < LeaderboardTester[] | null> (null)
  const [individual, setIndividual] = useState < Tester | null> (null)
  const {address} = useAccount();
  const { smartAccount ,smartAccountClient } = useUserSmartAccount();
 const [isClaiming, setIsClaiming] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const[testerStatusChecked, setTesterStatusChecked] = useState(false);
   const [isNotTester, setIsNotTester] = useState(true);
   const {writeContractAsync } = useWriteContract();
 
  
  // checks if the smart account of the address is been set
  useEffect(()=>{
     const checkSetSmartAccount = async() =>{
      if(!smartAccount || !address) return;
      const isRegistered = await checkIfSmartAccount(address as string);
      if(isRegistered) return;
      // set smart account
      const hash = await setSmartAccountToBC(address, smartAccount.address);
      if(!hash) return;
      await setSmartAccount(address as string, smartAccount.address as string);
     }
     checkSetSmartAccount();
  }, [address, smartAccount])

 
 // Check if user is a tester
useEffect(() => {
  const getTesterStatus = async () => {
    if (!address) return;

    try {
      const testersString = await getTesters();
      const testersArray: string[] = JSON.parse(testersString || '[]');

      const isTester = testersArray.includes(address.toString());

      if (isTester && !individual?.isTester) {
        await updateAsTasker(address as string);
      }

      setTesterStatusChecked(true);
    } catch (error) {
      console.error("Failed to load TesterStatus:", error);
    }
  };

  getTesterStatus();
}, [address, individual]);

//  Load leaderboard only when address is ready and tester status check is done
useEffect(() => {
  const getLeaderboard = async () => {
    if (!address || !testerStatusChecked) return;

    setIsLoading(true);

    try {
      const currentUser = await getUser(address);
      setIndividual(currentUser);

      const leaderboard = await getTestersLeaderboard();
      setLeaderboardArray(leaderboard);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  getLeaderboard();
}, [address, testerStatusChecked]);

// function to set the smartaccount on bc
const setSmartAccountToBC = async (userAddress: `0x${string}`,smartAddress: string) =>{
  try {
    // 1. Add the reward to the user
    const res = await fetch('/api/add-smartAccount', {
      method: 'POST',
      body: JSON.stringify({
        userAddress: userAddress as string,
        smartAddress: smartAddress,
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  } catch (error) {
    console.log("unable to register s.a", error);
    return null;
  }

}

  const isSubtaskCompleted = (subtaskId: number): boolean => {
    if (!individual?.tasks || individual.tasks.length === 0) return false;
    const task = individual.tasks.find(t => t.subTaskId === subtaskId);
    return task?.completed || false;
  };

  // function to claim rewards
  const handleClaimReward = async (amount: bigint) => {
    if (!address) {
      toast.error("Wallet not connected. Please try again.");
      return;
    }
  
    if (isClaiming) return; // Prevent multiple clicks while claiming
  
    setIsClaiming(true);
    const toastId = toast.loading("Claiming rewards...");
  
    try {
      const amountInWei = BigInt(amount);

       // 1. Add the reward to the user
       const res = await fetch('/api/add-reward', {
        method: 'POST',
        body: JSON.stringify({
          userAddress: address,
          amount: parseEther(amountInWei),
        }),
      });
  
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // 1. Claim the reward
      const hash = await writeContractAsync({
        abi: contractAbi,
        address: contractAddress,
        functionName: 'claimRewards',
        args: [amountInWei, address],
      });
  
      if (!hash) {
        throw new Error("Failed to claim reward");
      }
  
      // 2. update the total earned & unClaimed
      await updateUnclaimed(address as string, amount);
  
      toast.success(`Successfully claimed ${formatEther(amount)} cUSD!`, {
        id: toastId
      });
    } catch (error) {
      console.error("Claiming error:", error);
      toast.error("Failed to claim reward. Please try again.", {
        id: toastId
      });
    } finally {
      setIsClaiming(false);
    }
  };


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

  // Helper functions
const calculateProgress = () => {
  const startDate = new Date('2025-07-14');
  const endDate = new Date('2025-07-28');
  const today = new Date();
  
  // If task hasn't started yet
  if (today < startDate) return 0;
  
  // If task has ended
  if (today > endDate) return 100;
  
  // Calculate progress percentage
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = today.getTime() - startDate.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsedDuration / totalDuration) * 100)));
};

const calculateDateStatus = () => {
  const startDate = new Date('2025-07-14');
  const endDate = new Date('2025-07-28');
  const today = new Date();
  
  // Task hasn't started yet
  if (today < startDate) {
    return (
      <>
        <Calendar className="w-4 h-4" />
        <span>Starts: {startDate.toLocaleDateString()}</span>
      </>
    );
  }
  
  // Task is ongoing
  if (today <= endDate) {
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return (
      <>
        <Clock className="w-4 h-4" />
        <span>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining</span>
      </>
    );
  }
  
  // Task has ended
  return (
    <>
      <CheckCircle className="w-4 h-4 text-green-500" />
      <span>Completed</span>
    </>
  );
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
        {calculateDateStatus()}
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
      <span className="text-sm font-medium text-gray-700">Period</span>
      <span className="text-sm text-gray-600">{calculateProgress()}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${calculateProgress()}%` }}
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
  <div className="space-y-4 gap-4">
    {taskDetails.subtasks.map((subtask, index) => {
      const isCompleted = isSubtaskCompleted(Number(subtask.id));
      return (
        <Link key={subtask.id} href={ `/Task/${slug}/SubTask/${subtask.id}?completed=${(isCompleted).toString()}`} >
          <div                    
            className={cn(
              'flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group',
              isCompleted
                ? 'bg-emerald-50 border-emerald-200'
                : `bg-white border-gray-200 cursor-pointer ${index == 5 ? 'hover:border-pink-300 hover:bg-pink-50':'hover:border-indigo-300 hover:bg-indigo-50'} `
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : index == 5 ? "bg-pink-100  text-pink-600 group-hover:bg-pink-200" : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'
              )}>
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : (index > 2 && index !== 5)? <BadgeInfo className="w-4 h-4" />:(index == 5) ? <Gift className="w-4 h-4" /> :(index + 1)}
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{subtask.title}</h4>
                <p className="text-sm font-semibold text-emerald-600">{subtask.reward}</p>
              </div>
            </div>
            {isCompleted ? (
              <div className="text-emerald-500">
                <CheckCircle className="w-5 h-5" />
              </div>
            ) : (
              <ChevronRight className={`w-5 h-5 text-gray-400 ${index == 5 ?"group-hover:text-pink-500":'group-hover:text-indigo-500'} `} />
            )}
          </div>
        </Link>
      );
    })}
  </div>
)}

{activeTab === 'leaderboard' && (
  isLoading ? (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  ) : leaderboardArray?.length === 0 ? (
    <div className="text-center p-8 text-gray-500">
    No participants yet.
  </div>
  ) : leaderboardArray ? (
    <div className="space-y-6">
      {/* Top leaderboard */}
      <div className="space-y-3">
        {leaderboardArray.slice(0, 3).map((user, index) => {
          const rank = index + 1;
          return (
            <div
              key={user.walletAddress}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                "border-2"
              )}
              style={{
                borderColor: rank === 1
                  ? "rgba(234, 179, 8, 0.5)"
                  : rank === 2
                  ? "rgba(209, 213, 219, 0.5)"
                  : "rgba(249, 115, 22, 0.5)",
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                  getRankColor(rank)
                )}>
                  {rank === 1 ? '🏆' : rank === 2 ? '🥈' : '🥉'}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {user.userName || `User ${rank}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {Number(formatEther(user.totalEarned)).toFixed(2)} cUSD
                  </p>
                </div>
              </div>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
          );
        })}
      </div>

      {/* Current user's position */}
      {individual && individual.isTester && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Your Position</h3>
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                {leaderboardArray.findIndex(u => u.walletAddress === address) + 1 || '?'}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {individual.userName || 'You'}
                </h4>
                <p className="text-sm text-gray-600">
                  {Number(formatEther(individual.totalEarned)).toFixed(2)} cUSD earned
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {leaderboardArray.findIndex(u => u.walletAddress === address) + 1 || '?'} / {leaderboardArray.length || '?'}
            </span>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="text-center p-8 text-gray-500">
      Failed to load leaderboard data. Please try again later.
    </div>
  )
)}


            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Earnings</h3>
                    <p className="text-3xl font-bold">{Number(formatEther(individual?.totalEarned?? BigInt(0))).toFixed(2)} CUSD</p>
                    <p className="text-emerald-100 text-sm mt-1">From this task</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-amber-800">Claimable Rewards</h4>
                    <span className="text-amber-700 font-bold">{Number(formatEther(individual?.claimable?? BigInt(0))).toFixed(2)} cUSD</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-4">
                    You have completed {individual?.tasks.length} subtasks. Complete more to earn additional rewards!
                  </p>
                  <button 
                  onClick={() => handleClaimReward(individual?.claimable!!)} 
                  disabled={isClaiming || !individual?.claimable || individual.claimable <= 0}
                  className={cn(
                    "w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]",
                    isClaiming ? "opacity-70 cursor-not-allowed" : "hover:from-amber-600 hover:to-orange-600",
                    (!individual?.claimable || individual.claimable <= 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isClaiming ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Claiming...</span>
                    </div>
                  ) : (
                    "Claim Rewards"
                  )}
                </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;