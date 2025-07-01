'use client';

import { useEffect, useState } from 'react';
import { Home as HomeIcon, Wallet, ArrowRight, ArrowDownUp, Coins, TrendingUp, Users, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { injected } from '@wagmi/connectors';
import { celo } from 'wagmi/chains';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import Image from 'next/image';

interface Task {
  id: string;
  title: string;
  reward: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon: React.ReactNode;
  description: string;
  participants: number;
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Watch Educational Video',
    reward: '0.5 cUSD',
    difficulty: 'Easy',
    icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
    description: 'Watch a 5-minute video about DeFi basics',
    participants: 1234
  },
  {
    id: '2',
    title: 'Share on Twitter',
    reward: '1.0 cUSD',
    difficulty: 'Easy',
    icon: <Users className="w-5 h-5 text-indigo-600" />,
    description: 'Share our latest announcement on Twitter',
    participants: 856
  },
  {
    id: '3',
    title: 'Complete Quiz',
    reward: '2.0 cUSD',
    difficulty: 'Medium',
    icon: <Gift className="w-5 h-5 text-indigo-600" />,
    description: 'Test your knowledge with our crypto quiz',
    participants: 542
  },
  {
    id: '4',
    title: 'Invite Friends',
    reward: '5.0 cUSD',
    difficulty: 'Hard',
    icon: <Coins className="w-5 h-5 text-indigo-600" />,
    description: 'Invite 3 friends to join ProofEarn',
    participants: 234
  },
];

export default function Home() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain, isPending } = useSwitchChain();
  const [currency, setCurrency] = useState('cusd')
  const [activeTab, setActiveTab] = useState<'home' | 'wallet'>('home');

  useEffect(() => {
    if (isConnected) {
      console.log('Connected to:', address);
    }
  }, [isConnected, address]);
  
  useEffect(() => {
    if (window.ethereum?.isMiniPay) {
      connect({ connector: injected({ target: "metaMask" }) });
    }
  }, [connect]);

  useEffect(() => {
    if (chain?.id !== celo.id) {
      switchChain({ chainId: celo.id });
    }
  }, [chain, isConnected, switchChain]);

  const handleConnect = async () => {
    try {
      connect({ connector: injected({ target: "metaMask" }) });
    } catch (error) {
      console.error(error);
    }
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  // function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Address copied to clipboard');
  };

  function HoverTagButton() {
    const [isHovering, setIsHovering] = useState(false);
  
    return (
      <motion.div
        className="relative"
        animate={{ rotate: isHovering ? 0 : 12 }}
        transition={{ type: "spring", stiffness: 300 }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
      >
        {/* Tag string */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0.5 h-10 bg-indigo-300 rounded-full" />
        {/* Tag hole */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-indigo-300 rounded-full z-10" />
  
        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 6px 12px rgba(99, 102, 241, 0.25)",
          }}
          whileTap={{ scale: 0.97 }}
          onClick={handleConnect}
          className="relative bg-white/80 hover:bg-white text-indigo-600 font-medium py-2.5 px-4 rounded-full border border-indigo-600 shadow-md flex items-center gap-2 transition-all backdrop-blur-md"
        >
          {/* Subtle animated dot */}
          <motion.span
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 border border-white"
          />
  
          <Wallet className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-sm">Connect</span>
        </motion.button>
      </motion.div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-gray to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-indigo-100 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            EarnBase
            </h1>
          </div>
        </div>
      </div>
      <AnimatePresence>
  {!isConnected && activeTab === 'home' && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-10 z-50"
    >
      <HoverTagButton />
    </motion.div>
  )}
</AnimatePresence>

     

      {/* Content */}
      <div className="pb-20">
        {activeTab === 'home' && (
          <div className="p-4 space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Welcome back!</h2>
                  <p className="text-indigo-100 mb-4">Complete tasks and earn crypto rewards</p>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-indigo-200 mb-1">Total Earned</p>
                <p className="text-2xl font-bold">12.5 cUSD</p>
              </div>
            </div>

            {/* Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Available Tasks</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {tasks.length} tasks
                </span>
              </div>
              
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group hover:border-indigo-200"
                    onClick={() => window.location.href = `/task/${task.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="bg-indigo-50 rounded-lg p-2 group-hover:bg-indigo-100 transition-colors">
                          {task.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium border',
                              getDifficultyColor(task.difficulty)
                            )}>
                              {task.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">
                              {task.participants.toLocaleString()} participants
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <div className="text-right">
                          <p className="font-semibold text-indigo-600">{task.reward}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
     <div className="p-4 space-y-8 max-w-5xl mx-auto">
     {/* Wallet Info */}
     <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
       <div className="flex items-center justify-between mb-4">
         <h3 className="text-lg font-semibold text-gray-900">Wallet Information</h3>
         <div
           className={`px-3 py-1 rounded-full text-xs font-medium ${
             isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
           }`}
         >
           {isConnected ? 'Connected' : 'Not Connected'}
         </div>
       </div>
   
       <div className="space-y-4">
         <div>
           <p className="text-sm text-gray-600 mb-2">Wallet Address</p>
           <div
             onClick={isConnected ? () => copyToClipboard(address || '') : handleConnect}
             className="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors"
           >
             <p className="text-sm font-mono text-gray-800 break-all">
               {isConnected ? address : 'Connect wallet'}
             </p>
           </div>
         </div>
   
         <div className="grid grid-cols-2 gap-4">
           <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg">
             <div className="flex items-center space-x-2 mb-2">
               <div className="bg-white p-1 rounded-full">
                 <Image src="/static/cusdLogo.jpg" alt="CUSD" width={24} height={24} className="rounded-full" />
               </div>
               <p className="text-sm font-medium">cUSD Balance</p>
             </div>
             <p className="text-2xl font-bold">12.5</p>
           </div>
   
           <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
             <div className="flex items-center space-x-2 mb-2">
               <div className="bg-white p-1 rounded-full">
                 <Image src="/static/ethLogo.png" alt="ETH" width={24} height={24} className="rounded-full" />
               </div>
               <p className="text-sm font-medium">ETH Balance</p>
             </div>
             <p className="text-2xl font-bold">0.025</p>
           </div>
         </div>
   
         {/* Single Send Button */}
         <div className="text-right">
           <button className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow hover:bg-indigo-700 transition">
             Send
           </button>
         </div>
       </div>
     </div>
   
     {/* Swap Section */}
     <div className="relative max-w-md mx-auto bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
       <h3 className="text-lg font-semibold text-gray-900 mb-6">Swap Tokens</h3>
   
       {/* Arrow Floating Between */}
       <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-10">
         <div className="bg-indigo-100 rounded-full p-2 border border-indigo-200 shadow-md">
           <ArrowDownUp className="w-5 h-5 text-indigo-600" />
         </div>
       </div>
   
       <div className="space-y-6 relative z-0">
         {/* From */}
         <div className="relative z-0">
           <label className="text-sm text-gray-600 mb-2 block">From</label>
           <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100 focus-within:border-indigo-300 transition-colors">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <Image
                   src={ currency === 'cusd' ? "/static/cusdLogo.jpg" : "/static/ethLogo.png"}
                   alt="CUSD"
                   width={28}
                   height={28}
                   className="rounded-full"
                 />
                 <select
  onChange={(e) => {
    setCurrency(e.target.value);}}
    value={currency}
  className="bg-white border border-gray-200 text-sm font-medium text-gray-800 rounded-md px-2 py-1 shadow-sm focus:outline-none"
>
  <option value="cusd">cUSD</option>
  <option value="eth">ETH</option>
</select>

               </div>
               <input
                 type="text"
                 placeholder="0.0"
                 className="bg-transparent text-right text-lg font-semibold text-gray-800 placeholder-gray-400 outline-none w-1/2"
               />
             </div>
             <div className="mt-2 text-right">
               <span className="text-sm text-gray-500">Balance: 12.5 cUSD</span>
             </div>
           </div>
         </div>
   
         {/* To */}
         <div>
           <label className="text-sm text-gray-600 mb-2 block">To</label>
           <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3">
                 <Image
                    src={ currency !== 'cusd' ? "/static/cusdLogo.jpg" : "/static/ethLogo.png"}
                   alt="ETH"
                   width={28}
                   height={28}
                   className="rounded-full"
                 />
                 <span className="font-medium text-gray-800">{ currency !== 'cusd' ? "cUSD" : "ETH"}</span>
               </div>
               <input
                 type="text"
                 placeholder="0.0"
                 className="bg-transparent text-right text-lg font-semibold text-gray-800 placeholder-gray-400 outline-none w-1/2"
                 readOnly
               />
             </div>
             <div className="mt-2 text-right">
               <span className="text-sm text-gray-500">Balance: 0.025 ETH</span>
             </div>
           </div>
         </div>
   
         {/* Swap Button */}
         <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]">
           Swap Tokens
         </button>
   
         {/* Exchange Rate */}
         <div className="text-center pt-2">
           <p className="text-sm text-gray-600">Exchange rate: 1 cUSD = 0.0002 ETH</p>
         </div>
       </div>
     </div>
   </div>
   
       
        
        )}
      </div>

{/* Floating Bottom Navigation */}
<div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm mx-auto">
  <div className="relative">
    {/* Background glow effect */}
    <div className="absolute inset-0 bg-indigo-50 blur-xl rounded-md -z-10"></div>
    
    {/* Navigation container */}
    <div className="bg-white/95 backdrop-blur-lg border border-indigo-200 rounded-md shadow-xl p-1.5">
      <div className="flex items-center justify-around relative">
        {[
          { key: 'home', label: 'Home', icon: HomeIcon },
          { key: 'wallet', label: 'Wallet', icon: Wallet }
        ].map((item, index) => (
          <div key={item.key}>
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as 'home' | 'wallet')}
              className={cn(
                'relative flex flex-col items-center px-6 py-3 rounded-full transition-all duration-300',
                activeTab === item.key 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-indigo-500'
              )}
            >
              <div className={cn(
                'p-2 rounded-full transition-all duration-300',
                activeTab === item.key 
                  ? 'bg-indigo-500/10 shadow-[0_4px_12px_rgba(99,102,241,0.15)]' 
                  : 'bg-transparent hover:bg-indigo-500/5'
              )}>
                <item.icon className={cn(
                  'w-5 h-5 transition-transform duration-300',
                  activeTab === item.key ? 'scale-110' : 'scale-100'
                )} />
              </div>
              {/* Active indicator - now below the icon */}
              {activeTab === item.key && (
                <div className="absolute bottom-1 w-6 h-1.5 bg-indigo-500 rounded-full"></div>
              )}
              <span className={cn(
                'text-xs font-medium mt-1 transition-all duration-300',
                activeTab === item.key ? 'scale-100 opacity-100' : 'scale-90 opacity-80'
              )}>
                {item.label}
              </span>
            </button>
            
            {/* Vertical divider - only between buttons */}
            {index === 0 && (
              <div className="absolute left-1/2 top-1/2 transform -translate-y-1/2 h-8 w-px bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
    </div>
  );
}