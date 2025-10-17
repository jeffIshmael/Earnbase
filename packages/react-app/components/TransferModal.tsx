'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAccount, useWriteContract } from 'wagmi';
import { cUSDAddress, USDCAddress } from '@/contexts/constants';
import { parseEther } from 'viem';
import { erc20Abi } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';

const TransferModal = ({ 
  cUSDBalance, 
  usdcBalance,
  onClose 
}: { 
  cUSDBalance: string; 
  usdcBalance: string;
  onClose: () => void;
}) => {
  const [transferToken, setTransferToken] = useState<'cUSD' | 'USDC'>('cUSD');
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);
  
  const { writeContractAsync } = useWriteContract();
  const {isConnected} = useAccount();

  const handleTransfer = async () => {
    if(!isConnected){
        toast("Please connect wallet.");
        return;
    }
    if (!transferAmount || !recipientAddress) return;
    
    if (!recipientAddress.startsWith('0x')) {
      toast.error("Enter a valid address starting with 0x");
      return;
    }
    
    if (isNaN(Number(transferAmount))) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (Number(transferAmount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    
    setIsTransferring(true);
    setTransferStatus(null);
    
    try {
      const isCUSD = transferToken === 'cUSD';
      const formattedAddress = recipientAddress as `0x${string}`;
      const tokenAddress = isCUSD ? cUSDAddress : USDCAddress;
      const amountInWei = isCUSD ? parseEther(transferAmount) : BigInt(Number(transferAmount) * 10 ** 6);
      
      const txHash = await writeContractAsync({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: "transfer",
        args: [formattedAddress, amountInWei]
      });

      if (!txHash) {
        setTransferStatus({
          success: false,
          message: 'Transaction failed. Please try again.'
        });
        return;
      }
      
      setTransferStatus({
        success: true,
        message: 'Transfer successful!',
        txHash
      });
      
      // Reset form
      setTransferAmount('');
      setRecipientAddress('');
    } catch (error: any) {
      setTransferStatus({
        success: false,
        message: error?.shortMessage || 'Transfer failed'
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 pb-32 sm:pb-20"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] w-full max-w-sm relative overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b-4 border-black rounded-b-2xl p-6 relative bg-celo-yellow">
            <h3 className="text-h4 font-gt-alpina font-thin text-black text-center tracking-wide">
              TRANSFER TOKENS
            </h3>
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 p-2 border-2 border-black rounded-full bg-white hover:bg-celo-dk-tan transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Token Selection */}
            <div>
              <label className="text-body-s text-celo-body mb-3 block font-inter font-bold">
                SELECT TOKEN
              </label>
              <div className="flex space-x-3">
                {[
                  { name: "cUSD", logo: "/static/cusdLogo.jpg" },
                  { name: "USDC", logo: "/static/usdclogo.png" },
                ].map(({ name, logo }) => (
                  <button
                    key={name}
                    onClick={() => setTransferToken(name as "cUSD" | "USDC")}
                    className={cn(
                      "flex-1 py-4 px-4 border-4 flex items-center justify-center rounded-xl font-inter font-bold transition-all duration-200 hover:scale-105 shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
                      transferToken === name
                        ? "bg-celo-yellow text-black border-black"
                        : "bg-celo-dk-tan text-black hover:bg-celo-purple hover:text-white"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Image 
                        src={logo}
                        alt={name}
                        width={26}
                        height={26}
                        className="rounded-full"
                      />
                      <span>{name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
  
            {/* Token Warning */}
            {transferToken && (
              <div className="bg-celo-orange/60 border-2 border-gray-700 text-gray-700 p-2 rounded-xl text-body-s font-inter leading-relaxed ">
                {transferToken === 'cUSD' ? (
                  <>
                    <strong className="font-heavy">IMPORTANT:</strong> Ensure the recipient wallet supports <strong>CUSD ON CELO</strong>. 
                    Tokens sent elsewhere are <strong>NOT RECOVERABLE</strong>.
                  </>
                ) : (
                  <>
                    <strong className="font-heavy">HEADS UP:</strong> Confirm the wallet supports <strong>USDC ON CELO NETWORK</strong>. 
                    Wrong networks may result in <strong>PERMANENT LOSS</strong>.
                  </>
                )}
              </div>
            )}
  
            {/* Recipient Address */}
            <div>
              <label className="text-body-s text-celo-body mb-3 block font-inter font-bold">
                RECIPIENT ADDRESS
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full bg-white border-4 border-black p-4 rounded-xl focus:border-celo-yellow focus:ring-0 outline-none font-inter text-body-s transition-all"
              />
            </div>
  
            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-body-s text-celo-body font-inter font-bold">
                  AMOUNT
                </label>
                <button 
                  onClick={() =>
                    setTransferAmount(transferToken === 'cUSD' ? cUSDBalance : usdcBalance)
                  }
                  className="text-body-s text-celo-purple hover:text-black font-inter font-heavy underline"
                >
                  MAX: {transferToken === 'cUSD' ? cUSDBalance : usdcBalance} {transferToken}
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-white border-4 border-black p-4 rounded-xl pr-20 focus:border-celo-yellow outline-none font-inter text-body-s transition-all"
                />
                <span className="absolute right-4 top-4 text-celo-body font-inter font-bold">
                  {transferToken}
                </span>
              </div>
            </div>
  
            {/* Transfer Button */}
            <motion.button
              onClick={handleTransfer}
              disabled={!transferAmount || !recipientAddress || isTransferring}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "w-full mt-8 py-4 border-4 border-black font-inter font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
                !transferAmount || !recipientAddress || isTransferring
                  ? "bg-celo-inactive text-white cursor-not-allowed"
                  : "bg-celo-yellow hover:bg-black hover:text-celo-yellow text-black"
              )}
            >
              {isTransferring ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                  <span className="text-body-s">TRANSFERRING...</span>
                </div>
              ) : (
                `TRANSFER ${transferToken}`
              )}
            </motion.button>
  
            {/* Transaction Status */}
            {transferStatus && (
              <div
                className={cn(
                  "p-4 border-4 border-black text-body-s mt-6 flex items-start space-x-3 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
                  transferStatus.success
                    ? "bg-celo-success text-white"
                    : "bg-celo-error text-white"
                )}
              >
                {transferStatus.success ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-inter">{transferStatus.message.toUpperCase()}</p>
                  {transferStatus.txHash && (
                    <a
                      href={`https://celoscan.io/tx/${transferStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-s mt-2 inline-block text-celo-yellow hover:text-white font-inter font-bold underline"
                    >
                      VIEW ON CELO EXPLORER
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  
};

export default TransferModal;