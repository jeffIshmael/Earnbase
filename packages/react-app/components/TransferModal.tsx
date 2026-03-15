'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, X, ArrowUpRight, Info, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { USDCAddress, url } from '@/blockchain/constants';
import { type Country3LetterCode } from "@selfxyz/common";
import { motion, AnimatePresence } from 'framer-motion';
import { prepareContractCall, getContract, sendTransaction, createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import { popWalletAndSubmit, popWalletOnly, submitWithTxHash } from '@/lib/x402-testing';

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
  const [isAgentTestMode, setIsAgentTestMode] = useState(true);
  const [isInitializingTest, setIsInitializingTest] = useState(false);
  const [isAutoFlowRunning, setIsAutoFlowRunning] = useState(false);
  const [lastTxHash, setLastTxHash] = useState('');

  const restrictedDummyTask = {
    title: "Restricted Agent Task",
    prompt: "This task is only for users in Kenya.",
    feedbackType: 'text_input',
    constraints: {
      participants: 1,
      rewardPerParticipant: 0.01,
      countryRestriction: true,
      countries: ["KEN"] as Country3LetterCode[]
    }
  };

  const complexDummyTask = {
    title: "Complex Multi-Subtask Task",
    prompt: "Please complete all steps below.",
    feedbackType: 'multiple_choice', // Root feedback type for legacy
    constraints: {
      participants: 1,
      rewardPerParticipant: 0.01
    },
    subtasks: [
      {
        title: "Upload a screenshot of your wallet",
        type: 'FILE_UPLOAD',
        fileTypes: ['image/png', 'image/jpeg'],
        order: 1
      },
      {
        title: "Which feature do you use most?",
        type: 'MULTIPLE_CHOICE',
        options: ["Swaps", "Staking", "Bridge", "Agent"],
        order: 2
      },
      {
        title: "Rate the agent performance (1-5)",
        type: 'RATING',
        order: 3
      }
    ]
  };

  const handleAutoFlow = async () => {
    setIsAutoFlowRunning(true);
    try {
      const result = await popWalletAndSubmit(restrictedDummyTask);
      setTransferStatus({
        success: true,
        message: `Restricted Task Success! ID: ${result.taskId}`,
        txHash: result.agentRequestId
      });
    } catch (e) { }
    finally { setIsAutoFlowRunning(false); }
  };

  const handlePopWalletOnly = async () => {
    setIsInitializingTest(true);
    try {
      const txHash = await popWalletOnly(complexDummyTask);
      setLastTxHash(txHash);
    } catch (e) { }
    finally { setIsInitializingTest(false); }
  };

  const handleSubmitHash = async () => {
    if (!lastTxHash) {
      toast.error("No transaction hash found. Please pay first.");
      return;
    }
    try {
      const result = await submitWithTxHash(lastTxHash, complexDummyTask);
      setTransferStatus({
        success: true,
        message: `Complex Task Created! ID: ${result.taskId}`,
        txHash: lastTxHash
      });
    } catch (e) {
      // Error handled in utility
    }
  };

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

      // If in Agent Test Mode, complete the lifecycle by notifying the backend
      if (isAgentTestMode) {
        try {
          toast.loading("Transfer confirmed. Finalizing Agent Task...");
          const finalResponse = await fetch('/api/agent/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Agent-Type': 'ERC8004',
              'PAYMENT-SIGNATURE': transactionHash
            },
            body: JSON.stringify(complexDummyTask)
          });

          if (finalResponse.ok) {
            const result = await finalResponse.json();
            toast.dismiss();
            toast.success("Agent Task Successfully Created!");
            setTransferStatus({
              success: true,
              message: `Task Created! ID: ${result.taskId}`,
              txHash: transactionHash
            });
            setIsAgentTestMode(false);
          } else {
            const err = await finalResponse.json();
            throw new Error(err.error || "Failed to finalize task creation");
          }
        } catch (fError: any) {
          console.error("Finalization Error:", fError);
          toast.dismiss();
          toast.error("Transfer succeeded but task creation failed: " + fError.message);
        }
      }
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
          className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] w-full max-w-sm relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b-4 border-black p-6 bg-celo-yellow flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <ArrowUpRight className="text-celo-yellow w-6 h-6" />
              </div>
              <div>
                <h3 className="text-h4 font-gt-alpina font-bold text-black tracking-wide">
                  SEND USDC
                </h3>
                {isAgentTestMode && (
                  <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-heavy tracking-widest uppercase">
                    Agent Test Mode
                  </span>
                )}

                {isAgentTestMode && !transferStatus?.success && (
                  <div className="mt-4 pt-4 border-t-2 border-black border-dashed space-y-3">
                    <p className="text-[10px] font-heavy text-black mb-1 flex items-center">
                      <TestTube className="w-3 h-3 mr-1" />
                      X402 REFINED TOOLS
                    </p>

                    {/* Flow A: Human Browser Automatic */}
                    <button
                      onClick={handleAutoFlow}
                      disabled={isAutoFlowRunning}
                      className="w-full h-10 bg-celo-yellow text-black border-4 border-black hover:bg-black hover:text-celo-yellow transition-all flex items-center justify-center space-x-2 font-heavy tracking-widest text-[10px]"
                    >
                      {isAutoFlowRunning ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"></div>
                      ) : (
                        <span>🌈 AUTO FLOW (POP+SUBMIT)</span>
                      )}
                    </button>

                    <div className="h-0.5 bg-black/5" />

                    {/* Flow B: Granular Agent/Skill Flow */}
                    <button
                      onClick={handlePopWalletOnly}
                      disabled={isInitializingTest}
                      className="w-full h-8 bg-white text-black border-2 border-black hover:bg-celo-lt-tan transition-all flex items-center justify-center space-x-2 font-heavy tracking-widest text-[9px]"
                    >
                      {isInitializingTest ? (
                        <div className="w-3 h-3 border-2 border-black border-t-transparent animate-spin rounded-full"></div>
                      ) : (
                        <span>1. POP WALLET (GET HASH)</span>
                      )}
                    </button>
                    <button
                      onClick={handleSubmitHash}
                      disabled={!lastTxHash}
                      className={cn(
                        "w-full h-8 border-2 border-black transition-all flex items-center justify-center space-x-2 font-heavy tracking-widest text-[9px]",
                        !lastTxHash ? "bg-celo-dk-tan text-black/40 cursor-not-allowed" : "bg-celo-purple text-white hover:bg-black"
                      )}
                    >
                      <span>2. SUBMIT WITH SKILL HASH</span>
                    </button>
                    {lastTxHash && (
                      <p className="text-[8px] font-mono text-celo-body break-all bg-white p-1 border border-black/10">
                        Agent Hash: {lastTxHash.substring(0, 10)}...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="p-2 border-2 border-black rounded-full bg-white hover:bg-celo-dk-tan transition-colors"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
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