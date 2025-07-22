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
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { sdk } from '@farcaster/miniapp-sdk';
import { useIsFarcaster } from '../context/isFarcasterContext';
import { getBalances } from '@/lib/Balance';
import { formatEther } from 'viem';
import {registerUser,getUser} from '@/lib/Prismafnctns';
import { useUserSmartAccount } from '../hooks/useUserSmartAccount';
import { getSwapping, performing } from '@/lib/Swapping';
import { Mento } from "@mento-protocol/mento-sdk";
import { providers, utils } from "ethers";
import { cUSDAddress, USDCAddress } from '@/contexts/constants';
import { useWalletClient } from 'wagmi';
import { Web3Provider } from "@ethersproject/providers";
import { ethers } from "ethers";

// Get signer and connect wallet only if needed
 const getSigner = async (): Promise<ethers.Signer | null> => {
  if (typeof window === "undefined" || !window.ethereum) {
    console.error("🦊 MetaMask not found.");
    return null;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

    const accounts = await provider.listAccounts();

    if (accounts.length === 0) {
      // No wallet connected yet, request access
      await provider.send("eth_requestAccounts", []);
    }

    return provider.getSigner();
  } catch (error) {
    console.error("❗ Failed to get signer:", error);
    return null;
  }
};



interface Task {
  id: string;
  title: string;
  reward: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon: React.ReactNode;
  description: string;
  participants: number;
}

interface miniTasks{
  id    :number;
  subTaskId :number;
  completed:boolean;
  claimed :boolean;
  feedback ?:string| null;
  reward  : bigint;
  aiRating? :string| null;
  createdAt :Date;
  userId: number;
}

interface User {
  fid: number;
  username?: string;
  displayName?: string;
}

export interface Tester{
  id :number;
  userName :string;  
  fid?:  number| null;      
  totalEarned :bigint;
  claimable    :bigint;
  walletAddress :string;
  smartAddress ?:string | null;
  isTester    :boolean;
  tasks: miniTasks[];
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Chamapay Beta testers',
    reward: '20+ cUSD',
    difficulty: 'Easy',
    icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
    description: 'Do the daily tasks and submit a solid feedback',
    participants: 12
  },
];

export default function Page() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain, isPending } = useSwitchChain();
  const [currency, setCurrency] = useState('cusd');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'wallet'>('home');
  const [isInterfaceReady, setIsInterfaceReady] = useState(false);
  const { isFarcaster, setIsFarcaster } = useIsFarcaster();
  const [farcasterChecked, setFarcasterChecked] = useState(false);
  const [fcDetails, setFcDetails] = useState<User | null>(null)
  const [cUSDBalance, setCUSDBalance] = useState <string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState <string | null>(null);
  const { smartAccount ,smartAccountClient } = useUserSmartAccount();
  const [userContext, setUserContext] = useState <Tester | null> (null);
  const [currencyFrom, setCurrencyFrom] = useState <"cUSD" | "USDC"| null> (null);
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('1 cUSD = 1 USDC');
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const { data: walletClient } = useWalletClient();
  const provider = new providers.JsonRpcProvider(
    "https://forno.celo.org"
  );


 
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
        if (!user) {
          await registerUser(
            fcDetails ? fcDetails?.username || "anonymous" :'notfarcaster',
            fcDetails ? fcDetails.fid : null,
            address as string,
            smartAccount ? smartAccount.address : null
          );
          return;
        } else {
          setUserContext(user);
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

  // wallet connection effect
  useEffect(() => {
    if (isFarcaster) return;
    if (window.ethereum?.isMiniPay) {
      connect({ connector: injected({ target: "metaMask" }) });
    }
  }, [isFarcaster]); // Only run when isFarcaster changes


  useEffect(() => {
    if (chain?.id !== celo.id) {
      switchChain({ chainId: celo.id });
    }
  }, [chain, isConnected]);

  // 4. Fetch token balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !isConnected) return;
  
      const {cUSDBalance, USDCBalance} = await getBalances(address as `0x${string}`);
      setCUSDBalance(Number(formatEther(cUSDBalance)).toFixed(3));
      setUsdcBalance((Number(USDCBalance) / 10 ** 6).toFixed(3));
    };
  
    fetchBalances();
  }, [address, isConnected]);
  
  // 5. Auto-switch to Celo chain
  useEffect(() => {
    if (chain?.id !== celo.id && isConnected) {
      switchChain({ chainId: celo.id });
    }
  }, [chain?.id, isConnected]);
  
  const handleConnect = async () => {
    try {
      connect({ connector: injected({ target: "metaMask" }) });
    } catch (error) {
      console.error(error);
    }
  };

  const sendEmails = async () =>{
    try {
      console.log("logging now.");
    //    // 1. Add the reward to the user
    // const res = await fetch('/api/email', {
    //   method: 'GET',
    // });
    // await getSwapping();
    // await performing("0.00001");

    // await swap();
    } catch (error) {
      console.log(error);
    }
   
  }

  // function to get the quote of the swapping
  const getQuoting = async (amount: string) => {
    if (!currencyFrom || !amount) {
      setAmountTo("");
      return;
    }
    setIsFetchingQuote(true);
    try {
      const mento = await Mento.create(provider);
      let amountToReceive: number | null = null;
  
      if (currencyFrom === "cUSD") {
        const USDCTokenAddr = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
        const cUSDTokenAddr = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
        const tokenUnits = 6;
        
        const amountIn = utils.parseUnits(amount, tokenUnits).toString();
        const quoteAmountOut = await mento.getAmountOut(
          USDCTokenAddr,
          cUSDTokenAddr,
          amountIn
        );
        amountToReceive = Number(utils.formatUnits(quoteAmountOut));
        setExchangeRate(`1 cUSD = ${(Number(amount)/amountToReceive).toFixed(4)} USDC`);
      } else if (currencyFrom === "USDC") {
        const USDCTokenAddr = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
        const cUSDTokenAddr = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
        const tokenUnits = 18;
        
        const amountIn = utils.parseUnits(amount, tokenUnits).toString();
        const quoteAmountOut = await mento.getAmountOut(
          cUSDTokenAddr,
          USDCTokenAddr,
          amountIn
        );
        amountToReceive = Number((Number(quoteAmountOut) / 10 ** 6).toFixed(3));
        setExchangeRate(`1 USDC = ${(amountToReceive/Number(amount)).toFixed(4)} cUSD`);
      }
  
      return amountToReceive;
    } catch (error) {
      console.error("Error getting quote:", error);
      toast.error("Failed to get quote. Please try again.");
      return null;
    }finally{
      setIsFetchingQuote(false);
    }
  };

  // function to perform a swap
// Swap cUSD to USDC
const performASwap = async (amount: string) => {
  try {
    const signer = await getSigner(); // Your method to get the signer
    if (!signer || !currencyFrom) {
      console.log("Missing signer or source currency.");
      return;
    }

    console.log("🔐 Signer obtained:", await signer.getAddress());

    // Initialize Mento SDK
    const mento = await Mento.create(signer);
    const tokenUnits = 18; // Assuming both tokens use 18 decimals
    const amountIn = utils.parseUnits(amount, tokenUnits);

    if (currencyFrom === "cUSD") {
      console.log("⚙️ Increasing trading allowance...");

      const USDCTokenAddr = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

      const allowanceTxObj = await mento.increaseTradingAllowance(
        USDCTokenAddr,
        amountIn
      );
      const allowanceTx = await signer.sendTransaction(allowanceTxObj);
      await allowanceTx.wait();

      console.log("✅ Allowance increased.");

      // Estimate expected output with 1% slippage
      const expectedAmountOut = amountIn.mul(99).div(100);

      console.log("🔄 Swapping cUSD to USDC...");

      const swapTxObj = await mento.swapIn(
        USDCAddress,
        cUSDAddress,
        amountIn,
        expectedAmountOut
      );

      const swapTx = await signer.sendTransaction(swapTxObj);
      const receipt = await swapTx.wait();

      console.log("✅ Swap complete. Transaction hash:", receipt.transactionHash);
    } else {
      console.log("❌ Unsupported source currency:", currencyFrom);
    }

  } catch (error: any) {
    console.error("❗ Swap failed:", error?.message || error);
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
      {!isConnected && activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50"
          >
            <HoverTagButton />
          </motion.div>
        )}

     

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
                <p className="text-2xl font-bold">{Number(formatEther(userContext?.totalEarned ?? BigInt(0))).toFixed(2)} cUSD</p>
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
                  <Link key={task.id} href={`/Task/${task.id}`}>
                    <div                      
                      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group hover:border-indigo-200"
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
                  </Link>
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
             <p className="text-2xl font-bold">{cUSDBalance}</p>
           </div>
   
           <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
             <div className="flex items-center space-x-2 mb-2">
               <div className="bg-white p-1 rounded-full">
                 <Image src="/static/usdclogo.png" alt="usdc" width={24} height={24} className="rounded-full" />
               </div>
               <p className="text-sm font-medium">USDC Balance</p>
             </div>
             <p className="text-2xl font-bold">{usdcBalance}</p>
           </div>
         </div>
   
         {/* Single Send Button */}
         {/* <div className="text-right">
           <button onClick={()=>sendEmails() } className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow hover:bg-indigo-700 transition">
             Send
           </button>
         </div> */}
       </div>
     </div>
   
     {/* Swap Section */}
    {/* Swap Section */}
{/* Swap Section */}
<div className="relative max-w-md mx-auto bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
  <h3 className="text-lg font-semibold text-gray-900 mb-6">Swap Tokens</h3>

  {/* Arrow Floating Between */}
  <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 z-10">
    <button 
      onClick={async () => {
        if (!currencyFrom) return;
        setCurrencyFrom(currencyFrom === "cUSD" ? "USDC" : "cUSD");
        if (amountFrom) {
          const quote = await getQuoting(amountFrom);
          if (quote) setAmountTo(quote.toString());
        }
      }}
      className="bg-indigo-100 rounded-full p-2 border border-indigo-200 shadow-md hover:bg-indigo-200 transition-colors"
    >
      <ArrowDownUp className="w-5 h-5 text-indigo-600" />
    </button>
  </div>

  <div className="space-y-6 relative z-0">
    {/* From */}
    <div className="relative z-0">
      <label className="text-sm text-gray-600 mb-2 block">From</label>
      <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src={currencyFrom === "cUSD" ? "/static/cusdLogo.jpg" : "/static/usdclogo.png"}
              alt={currencyFrom || "Token"}
              width={28}
              height={28}
              className="rounded-full"
            />
            <select
              value={currencyFrom || ""}
              onChange={(e) => setCurrencyFrom(e.target.value as "cUSD" | "USDC")}
              className="bg-white border border-gray-200 text-sm font-medium text-gray-800 rounded-md px-2 py-1 shadow-sm focus:outline-none"
            >
              <option value="">Select</option>
              <option value="cUSD">cUSD</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
          <input
            type="number"
            placeholder="0.0"
            value={amountFrom}
            onChange={async (e) => {
              const value = e.target.value;
              setAmountFrom(value);
              if (value && currencyFrom) {
                setAmountTo("Calculating...");
                const quote = await getQuoting(value);
                if (quote) setAmountTo(quote.toString());
              } else {
                setAmountTo("");
              }
            }}
            className="bg-transparent text-right text-lg font-semibold text-gray-900 placeholder-gray-400 outline-none w-1/2"
          />
        </div>
        <div className="mt-2 text-right">
          <span className="text-sm text-gray-400">
            Balance: {currencyFrom === "cUSD" ? `${cUSDBalance} cUSD` : `${usdcBalance} USDC`}
          </span>
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
          src={currencyFrom === "cUSD" ? "/static/usdclogo.png" : "/static/cusdLogo.jpg"}
          alt={currencyFrom === "cUSD" ? "USDC" : "cUSD"}
          width={28}
          height={28}
          className="rounded-full"
        />
        <span className="font-medium text-gray-500">
          {currencyFrom === "cUSD" ? "USDC" : "cUSD"}
        </span>
      </div>
      {isFetchingQuote ? (
        <div className="flex items-center justify-end w-1/2">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <input
          type="text"
          placeholder="0.0"
          value={amountTo}
          readOnly
          className="bg-transparent text-right text-lg font-semibold text-gray-500 placeholder-gray-400 outline-none w-1/2"
        />
      )}
    </div>
    <div className="mt-2 text-right">
      <span className="text-sm text-gray-400">
        Balance: {currencyFrom === "cUSD" ? `${usdcBalance} USDC` : `${cUSDBalance} cUSD`}
      </span>
    </div>
  </div>
</div>

   {/* Exchange Rate */}
<div className="text-center pt-2">
  {isFetchingQuote ? (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-400">Fetching rate...</p>
    </div>
  ) : (
    <p className="text-sm text-gray-400">
      {exchangeRate}
    </p>
  )}
</div>

    {/* Swap Button */}
    <button 
        onClick={async() => performASwap(amountFrom)}
        disabled={!amountFrom || !currencyFrom || isSwapping || isFetchingQuote}
        className={cn(
          "w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg",
          (!amountFrom || !currencyFrom || isFetchingQuote) && "opacity-50 cursor-not-allowed",
          isSwapping && "opacity-70 cursor-not-allowed"
        )}
      >
      {isSwapping ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Swapping...</span>
        </div>
      ) : (
        "Swap"
      )}
    </button>
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