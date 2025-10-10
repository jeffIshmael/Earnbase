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
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-white border-4 border-black w-full max-w-sm relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="border-b-4 border-black p-6 relative">
            <h3 className="text-h3 font-gt-alpina font-thin text-black text-center">TRANSFER TOKENS</h3>
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 p-2 hover:bg-celo-dk-tan transition-colors border-2 border-black"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Token Selection */}
            <div>
              <label className="text-body-s text-celo-body mb-3 block font-inter font-heavy">TOKEN</label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setTransferToken('cUSD')}
                  className={cn(
                    'flex-1 py-4 px-4 border-4 transition-all duration-200 flex items-center justify-center font-inter font-heavy',
                    transferToken === 'cUSD'
                      ? 'bg-celo-yellow border-black text-black'
                      : 'bg-celo-dk-tan border-black text-black hover:bg-celo-purple hover:text-white'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Image 
                      src="/static/cusdLogo.jpg" 
                      alt="cUSD" 
                      width={24} 
                      height={24} 
                      className="border-2 border-black"
                    />
                    <span className="text-body-s">CUSD</span>
                  </div>
                </button>
                <button
                  onClick={() => setTransferToken('USDC')}
                  className={cn(
                    'flex-1 py-4 px-4 border-4 transition-all duration-200 flex items-center justify-center font-inter font-heavy',
                    transferToken === 'USDC'
                      ? 'bg-celo-yellow border-black text-black'
                      : 'bg-celo-dk-tan border-black text-black hover:bg-celo-purple hover:text-white'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Image 
                      src="/static/usdclogo.png" 
                      alt="USDC" 
                      width={24} 
                      height={24} 
                      className="border-2 border-black"
                    />
                    <span className="text-body-s">USDC</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Token-specific warning */}
            <div>
            {transferToken === 'cUSD' && (
            <div className="bg-celo-orange border-4 border-black text-black p-4 text-body-s font-inter">
                <strong className="font-heavy">IMPORTANT:</strong> Ensure the recipient's wallet supports <strong className="font-heavy">CUSD ON CELO</strong>. 
                Tokens sent to unsupported wallets are <strong className="font-heavy">NOT RECOVERABLE</strong>.
            </div>
            )}

            {transferToken === 'USDC' && (
            <div className="bg-celo-orange border-4 border-black text-black p-4 text-body-s font-inter">
                <strong className="font-heavy">HEADS UP:</strong> Make sure the recipient wallet or exchange supports <strong className="font-heavy">USDC ON THE CELO NETWORK</strong>.
                Transfers to incompatible networks may result in <strong className="font-heavy">PERMANENT LOSS OF FUNDS</strong>.
            </div>
            )}
            </div>

            {/* Recipient Address */}
            <div>
              <label className="text-body-s text-celo-body mb-3 block font-inter font-heavy">RECIPIENT ADDRESS</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full bg-white border-4 border-black p-4 focus:border-celo-yellow focus:ring-0 outline-none transition-all font-inter text-body-s"
              />
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-body-s text-celo-body font-inter font-heavy">AMOUNT</label>
                <button 
                  onClick={() => setTransferAmount(transferToken === 'cUSD' ? cUSDBalance : usdcBalance)}
                  className="text-body-s text-celo-purple hover:text-black font-inter font-heavy"
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
                  className="w-full bg-white border-4 border-black p-4 focus:border-celo-yellow focus:ring-0 outline-none transition-all pr-20 font-inter text-body-s"
                />
                <span className="absolute right-4 top-4 text-celo-body font-inter font-heavy">
                  {transferToken}
                </span>
              </div>
            </div>

      

            {/* Transfer Button */}
            <button
              onClick={handleTransfer}
              disabled={!transferAmount || !recipientAddress || isTransferring}
              className={cn(
                "w-full mt-8 py-4 border-4 border-black font-inter font-heavy transition-all duration-200 relative",
                !transferAmount || !recipientAddress || isTransferring
                  ? "bg-celo-inactive text-white cursor-not-allowed"
                  : "bg-celo-yellow hover:bg-black hover:text-celo-yellow text-black"
              )}
            >
              {isTransferring ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin"></div>
                  <span className="text-body-s">TRANSFERRING...</span>
                </div>
              ) : (
                `TRANSFER ${transferToken}`
              )}
            </button>

            {/* Transaction Status */}
            {transferStatus && (
              <div className={cn(
                "p-4 border-4 border-black text-body-s mt-6 flex items-start space-x-3",
                transferStatus.success 
                  ? "bg-celo-success text-white" 
                  : "bg-celo-error text-white"
              )}>
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
                      className="text-body-s mt-2 inline-block text-celo-yellow hover:text-white font-inter font-heavy"
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