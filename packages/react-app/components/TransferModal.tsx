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
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-white rounded-2xl w-full max-w-sm relative overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="border-b border-gray-100 p-4 relative">
            <h3 className="text-lg font-semibold text-gray-900 text-center">Transfer Tokens</h3>
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6 space-y-4">
            {/* Token Selection */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Token</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTransferToken('cUSD')}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg border transition-colors flex items-center justify-center',
                    transferToken === 'cUSD'
                      ? 'bg-indigo-200 border-indigo-300 text-indigo-700 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Image 
                      src="/static/cusdLogo.jpg" 
                      alt="cUSD" 
                      width={20} 
                      height={20} 
                      className="rounded-full"
                    />
                    <span>cUSD</span>
                  </div>
                </button>
                <button
                  onClick={() => setTransferToken('USDC')}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg border transition-colors flex items-center justify-center',
                    transferToken === 'USDC'
                      ? 'bg-indigo-200 border-indigo-300 text-indigo-700 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Image 
                      src="/static/usdclogo.png" 
                      alt="USDC" 
                      width={20} 
                      height={20} 
                      className="rounded-full"
                    />
                    <span>USDC</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Token-specific warning */}
            <div>
            {transferToken === 'cUSD' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-3 text-sm rounded-md">
                <strong>Important:</strong> Ensure the recipient’s wallet supports <strong>cUSD on Celo</strong>. 
                Tokens sent to unsupported wallets are <strong>not recoverable</strong>.
            </div>
            )}

            {transferToken === 'USDC' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-3 text-sm rounded-md">
                <strong>Heads up:</strong> Make sure the recipient wallet or exchange supports <strong>USDC on the Celo network</strong>.
                Transfers to incompatible networks may result in <strong>permanent loss of funds</strong>.
            </div>
            )}
            </div>

            {/* Recipient Address */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full bg-gray-50 rounded-lg p-3 border-2 border-gray-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none transition-all font-mono text-sm"
              />
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-600">Amount</label>
                <button 
                  onClick={() => setTransferAmount(transferToken === 'cUSD' ? cUSDBalance : usdcBalance)}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Max: {transferToken === 'cUSD' ? cUSDBalance : usdcBalance} {transferToken}
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-gray-50 rounded-lg p-3 border-2 border-gray-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none transition-all pr-16"
                />
                <span className="absolute right-3 top-3 text-gray-500 font-medium">
                  {transferToken}
                </span>
              </div>
            </div>

      

            {/* Transfer Button */}
            <button
              onClick={handleTransfer}
              disabled={!transferAmount || !recipientAddress || isTransferring}
              className={cn(
                "w-full mt-6 py-3.5 rounded-lg font-medium transition-all relative",
                !transferAmount || !recipientAddress || isTransferring
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700"
              )}
            >
              {isTransferring ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Transferring...</span>
                </div>
              ) : (
                `Transfer ${transferToken}`
              )}
            </button>

            {/* Transaction Status */}
            {transferStatus && (
              <div className={cn(
                "p-3 rounded-lg text-sm mt-4 flex items-start space-x-2",
                transferStatus.success 
                  ? "bg-emerald-50 text-emerald-700" 
                  : "bg-red-50 text-red-700"
              )}>
                {transferStatus.success ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p>{transferStatus.message}</p>
                  {transferStatus.txHash && (
                    <a 
                      href={`https://celoscan.io/tx/${transferStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-1 inline-block text-indigo-600 hover:underline"
                    >
                      View on Celo Explorer
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