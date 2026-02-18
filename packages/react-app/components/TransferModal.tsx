'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, X, ArrowUpRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { USDCAddress } from '@/contexts/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { prepareContractCall, getContract, sendTransaction, createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string | undefined | null;
  usdcBalance: string;
}

const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  address,
  usdcBalance,
}) => {
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);

  const handleTransfer = async () => {
    if (!address) {
      toast.error("Please connect wallet.");
      return;
    }
    if (!transferAmount || !recipientAddress) {
      toast.error("Please enter amount and recipient address.");
      return;
    }

    if (!recipientAddress.startsWith('0x')) {
      toast.error("Enter a valid address starting with 0x");
      return;
    }

    if (Number(transferAmount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setIsTransferring(true);
    setTransferStatus(null);
    try {
      // USDC has 6 decimals
      const amountInUnits = BigInt(Math.floor(Number(transferAmount) * 10 ** 6));

      // Using thirdweb to send USDC
      const transaction = prepareContractCall({
        contract: getContract({
          client,
          chain: celo,
          address: USDCAddress,
        }),
        method: "function transfer(address to, uint256 amount)",
        params: [recipientAddress as `0x${string}`, amountInUnits],
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: address as any,
      });

      toast.success("Transfer successful!");
      setTransferStatus({
        success: true,
        message: 'Transfer successful!',
        txHash: transactionHash
      });
    } catch (error: any) {
      console.error("Transfer Error:", error);
      toast.error(error?.shortMessage || "Transfer failed. Please try again.");
      setTransferStatus({
        success: false,
        message: error?.shortMessage || 'Transfer failed'
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] w-full max-w-md relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b-4 border-black p-6 bg-celo-yellow flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <ArrowUpRight className="text-celo-yellow w-6 h-6" />
              </div>
              <h3 className="text-h4 font-gt-alpina font-bold text-black tracking-wide">
                SEND USDC
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 border-2 border-black rounded-full bg-white hover:bg-celo-dk-tan transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* USDC Info */}
            <div className="bg-celo-purple/5 border-2 border-celo-purple/20 p-4 rounded-xl flex items-start space-x-3">
              <Info className="w-5 h-5 text-celo-purple shrink-0 mt-0.5" />
              <p className="text-[12px] font-inter text-celo-body leading-relaxed">
                Confirm you are sending <span className="font-bold text-celo-purple">USDC</span> on the <span className="font-bold text-celo-purple">Celo network</span>. Irreversible once sent.
              </p>
            </div>

            {/* Recipient Address */}
            <div>
              <label className="text-[10px] font-inter font-heavy text-celo-body mb-2 block uppercase tracking-widest">
                RECIPIENT ADDRESS
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full bg-celo-lt-tan border-4 border-black p-4 rounded-xl focus:border-celo-purple focus:ring-0 outline-none font-mono text-sm transition-all"
              />
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-inter font-heavy text-celo-body uppercase tracking-widest">
                  AMOUNT
                </label>
                <button
                  onClick={() => setTransferAmount(usdcBalance)}
                  className="text-[10px] text-celo-purple hover:text-black font-inter font-heavy underline tracking-tight"
                >
                  MAX: {usdcBalance} USDC
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-celo-lt-tan border-4 border-black p-4 rounded-xl pr-20 focus:border-celo-purple outline-none font-gt-alpina text-h4 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-celo-body font-inter font-bold">
                  USDC
                </span>
              </div>
            </div>

            {/* Transfer Button */}
            <button
              onClick={handleTransfer}
              disabled={!transferAmount || !recipientAddress || isTransferring}
              className={cn(
                "w-full py-5 border-4 border-black font-inter font-heavy text-lg rounded-2xl transition-all duration-200 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none",
                !transferAmount || !recipientAddress || isTransferring
                  ? "bg-celo-dk-tan opacity-50 cursor-not-allowed"
                  : "bg-celo-yellow hover:bg-black hover:text-celo-yellow text-black"
              )}
            >
              {isTransferring ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                  <span>TRANSFERRING...</span>
                </div>
              ) : (
                "SEND USDC NOW"
              )}
            </button>

            {/* Transaction Status */}
            {transferStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={cn(
                  "p-4 border-4 border-black text-sm flex items-start space-x-3 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
                  transferStatus.success
                    ? "bg-celo-success/10 border-celo-success/50 text-celo-success"
                    : "bg-celo-orange/10 border-celo-orange/50 text-celo-orange"
                )}
              >
                {transferStatus.success ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-inter font-bold">{transferStatus.message}</p>
                  {transferStatus.txHash && (
                    <a
                      href={`https://celoscan.io/tx/${transferStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-2 inline-block text-black hover:underline font-inter font-bold"
                    >
                      VIEW ON CELOSCAN ↗
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransferModal;