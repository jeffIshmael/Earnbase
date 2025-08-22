'use client';

import { useState, useEffect } from 'react';
import { Wallet, Copy, ExternalLink, TrendingUp, ArrowUpRight, ArrowDownLeft, RefreshCw, LucideArrowDownLeftSquare } from 'lucide-react';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { injected } from '@wagmi/connectors';
import { celo } from 'wagmi/chains';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatEther } from 'viem';
import { getBalances } from '@/lib/Balance';
import { getUser } from '@/lib/Prismafnctns';
import { useUserSmartAccount } from '../hooks/useUserSmartAccount';
import BottomNavigation from '@/components/BottomNavigation';
import TransferModal from '@/components/TransferModal';
import { CeloLogo } from '@/components/CeloLogo';
import Image from 'next/image';
import { useDebouncedValue } from '@/utils/Hook';
import { TradablePair } from '@mento-protocol/mento-sdk';
import {  getTheQuote, approveSwap, executeSwap } from '@/lib/Swapping';
import { waitForTransactionReceipt } from '@wagmi/core'
import { config } from '@/providers/AppProvider';
import { cn } from '@/lib/utils';
import { cUSDAddress, USDCAddress } from '@/contexts/constants';


interface Quote {
  amountWei: string;
  quoteWei: string;
  quote: string;
  rate: string;
  tradablePair: TradablePair;
} 

export default function WalletPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain, isPending } = useSwitchChain();
  const { smartAccount } = useUserSmartAccount();
  
  const [cUSDBalance, setCUSDBalance] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currencyFrom, setCurrencyFrom] = useState <"cUSD" | "USDC"| null> (null);
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('1 cUSD = 0.999 USDC');
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quoteInterface, setQuoteInterface] = useState< Quote | null>(null);
  const debouncedAmount = useDebouncedValue(amountFrom, 500);


  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (chain?.id !== celo.id && isConnected) {
      switchChain({ chainId: celo.id });
    }
  }, [chain, isConnected]);

  const fetchBalances = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      const { cUSDBalance, USDCBalance } = await getBalances(address as `0x${string}`);
      setCUSDBalance(Number(formatEther(cUSDBalance)).toFixed(3));
      setUsdcBalance((Number(USDCBalance) / 10 ** 6).toFixed(3));
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      connect({ connector: injected({ target: "metaMask" }) });
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const openCeloScan = (address: string) => {
    window.open(`https://celoscan.io/address/${address}`, '_blank');
  };

    // function to handle getting quote
    const getQuote = async (fromcUSD: boolean) =>{
      if(isNaN(Number(amountFrom)) || Number(amountFrom) <= 0) return;
      try {
        setIsFetchingQuote(true);
        const quote = await getTheQuote(amountFrom,fromcUSD);
        setQuoteInterface(quote);
        const rate = `1 ${fromcUSD ? "cUSD" : "USDC"} = ${quote?.rate} ${fromcUSD ? "USDC": "cUSD"}`;
        setExchangeRate(rate);
        setAmountTo(quote?.quote ?? "");
        setIsFetchingQuote(false);
      } catch (error) {
        console.log(error);
        toast.error("Unable to fetch price quote.")
      }finally{
        setIsFetchingQuote(false);
      }
    }
  
    // function to do the swap
    const handleSwap = async (fromcUSD: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
      if (!quoteInterface) {
        toast.error("Quote not available. Please try again.");
        return;
      }
      if (!address) {
        toast.error("Please connect wallet.");
        return;
      }
  
      // ensure its connected to celo
      if (chain?.id !== celo.id) {
        switchChain({ chainId: celo.id });
      }
    
      const fromTokenSymbol = fromcUSD ? "cUSD" : "USDC";
      const toTokenSymbol = fromcUSD ? "USDC" : "cUSD";
      const fromTokenAddress = fromcUSD ? cUSDAddress : USDCAddress;
      const toTokenAddress = fromcUSD ? USDCAddress : cUSDAddress;
  
      try {
        setIsApproving(true);
        toast.loading("Approving token for swap...");
    
        const approvalTx = await approveSwap(fromTokenAddress, quoteInterface.amountWei);
    
        if (!approvalTx) {
          toast.dismiss();
          toast.error("Approval failed. Please try again.");
          return;
        }
    
        toast.dismiss();
        toast.success("Approval successful.");
    
        setIsApproving(false);
        setIsSwapping(true);
        toast.loading("Swapping tokens...");
    
        const swapTx = await executeSwap(
          fromTokenAddress,
          toTokenAddress,
          quoteInterface.amountWei,
          quoteInterface.quoteWei,
          quoteInterface.tradablePair,
          fromcUSD
        );
    
        if (!swapTx) {
          toast.dismiss();
          toast.error("Swap failed. Please try again.");
          return;
        }
  
        const transactionReceipt = await waitForTransactionReceipt(config, {
          chainId: celo.id, 
          hash: swapTx ,
        })
  
        if(transactionReceipt && transactionReceipt.status === "success"){
          setIsSwapping(false);
          toast.dismiss();
          toast(
            <div className="flex flex-col">
              <span>
                ✅ Successfully swapped {amountFrom} {fromTokenSymbol} to {Number(amountTo).toFixed(4)} {toTokenSymbol}
              </span>
              <a
                href={`https://celoscan.io/tx/${swapTx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block w-fit rounded-md bg-green-500 px-3 py-1 text-white text-sm font-medium hover:bg-green-600 transition"
              >
                View on CeloScan
              </a>
            </div>
          );
          setAmountFrom("");
          setAmountTo("");
          // get the balances again
          await getBalances(address as `0x${string}`);
        }else{
          toast.dismiss();
          toast.error("Swap transaction failed or reverted.");
        }
      } catch (error) {
        console.error("Swap error:", error);
        toast.dismiss();
        toast.error("An error occurred. Please try again.");
      } finally {
        setIsApproving(false);
        setIsSwapping(false);
      }
    };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your wallet information.
          </p>
          <button
            onClick={handleConnect}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-indigo-100 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
              <p className="text-sm text-gray-600">Manage your crypto assets</p>
            </div>
          </div>
          <button
            onClick={fetchBalances}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Wallet Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Wallet Status</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Wallet Address</p>
                <p className="text-sm font-mono text-gray-900 truncate">
                  {address}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <button
                  onClick={() => copyToClipboard(address!)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openCeloScan(address!)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Smart Account */}
          {smartAccount && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-indigo-600 mb-1">Smart Account</p>
                  <p className="text-sm font-mono text-indigo-900 truncate">
                    {smartAccount.address}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(smartAccount.address)}
                  className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition ml-3"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Token Balances */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Balances</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* cUSD Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="relative w-8 h-8">
                  <Image
                    src="/static/cusdLogo.jpg"
                    alt="CUSD"
                    width={32}
                    height={32}
                    className="object-cover bg-white rounded-full p-0.5"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4">
                    <CeloLogo />
                  </div>
                </div>
                <p className="text-sm font-medium">cUSD Balance</p>
              </div>
              <p className="text-2xl font-bold">
                {isLoading ? '...' : cUSDBalance || '0.000'}
              </p>
            </div>

            {/* USDC Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="relative w-8 h-8">
                  <Image
                    src="/static/usdclogo.png"
                    alt="USDC"
                    width={32}
                    height={32}
                    className="object-cover rounded-full bg-white"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4">
                    <CeloLogo />
                  </div>
                </div>
                <p className="text-sm font-medium">USDC Balance</p>
              </div>
              <p className="text-2xl font-bold">
                {isLoading ? '...' : usdcBalance || '0.000'}
              </p>
            </div>
          </div>

          {/* Send Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-indigo-100 border border-indigo-600 text-indigo-700 hover:bg-indigo-600 hover:text-white font-medium py-3 px-8 rounded-xl shadow-sm transition-all flex items-center space-x-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send Tokens</span>
            </button>
          </div>
        </motion.div>

      {/* Swap Section */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
    >
        {/* Swap Section */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Swap Tokens</h3>

      {/* Arrow Floating Between */}
      <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 z-10">
        <button 
          onClick={async () => {
            if (!currencyFrom) return;
            setCurrencyFrom(currencyFrom === "cUSD" ? "USDC" : "cUSD");
            if (amountFrom) {
              await getQuote(currencyFrom === "cUSD");
            }
          }}
          className="bg-indigo-100 rounded-full p-2 border border-indigo-200 shadow-md hover:bg-indigo-200 transition-colors"
        >
          <ArrowDownLeft className="w-5 h-5 text-indigo-600" />
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
                onChange={(e) => {
                  const value = e.target.value;
                  setAmountFrom(value);
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
            onClick={(e) => handleSwap(currencyFrom === "cUSD",e)}
            disabled={!isConnected || isNaN(Number(amountFrom)) || Number(amountFrom) <= 0 || !amountFrom || !currencyFrom || isSwapping || isFetchingQuote || isApproving}
            className={cn(
              "w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg",
              (isNaN(Number(amountFrom)) || Number(amountFrom) <= 0|| !amountFrom || !currencyFrom || isFetchingQuote) && "opacity-50 cursor-not-allowed",
              isApproving||isSwapping && "opacity-70 cursor-not-allowed"
            )}
          >
          {isApproving ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Approving Tx...</span>
            </div>
          ) :isSwapping ? (
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
                 </motion.div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          cUSDBalance={cUSDBalance ?? '0'}
          usdcBalance={usdcBalance ?? '0'}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      <BottomNavigation />
    </div>
  );
} 