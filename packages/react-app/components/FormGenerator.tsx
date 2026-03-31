"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TaskWithEligibility } from "@/lib/taskService";
import {
  FileText,
  Star,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Receipt,
  User,
  Hash,
  ArrowUpRight,
  X,
  Zap,
  Sparkles,
  Search
} from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { toast } from "sonner";
import Confetti from "react-confetti";
import {
  createTaskSubmissionWithResponses,
  updateEarnings,
  hasUserSubmittedToTask,
  getUser,
} from "@/lib/Prismafnctns";
import { formatUnits } from "viem";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useIsFarcaster } from "@/app/context/isFarcasterContext";
import { payoutTaskerAction } from "@/lib/payoutActions";
import { uploadFileToIpfs } from "@/lib/ipfs";
import { reputationAbi, reputationRegistryAddress, contractAddress, contractAbi } from "@/blockchain/constants";
import { createThirdwebClient } from "thirdweb";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "@/providers/AppProvider";
import { celo } from "viem/chains";

import { validateAnswer } from "@/lib/validator";

const twClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

interface FormGeneratorProps {
  task: TaskWithEligibility;
  onTaskCompleted?: () => void;
  closeFormGenerator?: () => void;
}

interface TaskSubmission {
  taskId: number;
  subtaskResponses: SubtaskResponse[];
  totalScore: number;
  feedback: string;
  submittedAt: string;
}

interface SubtaskResponse {
  subtaskId: number;
  response: string | string[] | File | number;
  completed: boolean;
}

type ValidationStatus = 'initial' | 'validating' | 'valid' | 'invalid';

export default function FormGenerator({
  task,
  onTaskCompleted,
  closeFormGenerator,
}: FormGeneratorProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionResults, setSubmissionResults] =
    useState<TaskSubmission | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    baseReward: number;
    bonusReward: number;
    totalReward: number;
    aiRating: number;
    explanation: string;
    transactionHash?: string;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // AI Validation State
  const [validationStatuses, setValidationStatuses] = useState<Record<string, ValidationStatus>>({});
  const [validationReasons, setValidationReasons] = useState<Record<string, string>>({});

  // On-chain Feedback State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("RLHF");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [agentRating, setAgentRating] = useState(100);
  const [isUploading, setIsUploading] = useState(false);
  const [contractAgentId, setContractAgentId] = useState<bigint | null>(null);
  const { writeContractAsync } = useWriteContract();

  const { isConnected } = useAccount();
  const { isFarcaster } = useIsFarcaster();
  const router = useRouter();
  const { chain } = useAccount();

  // Initialize responses for all subtasks
  useEffect(() => {
    const initialResponses: Record<string, any> = {};
    const initialStatuses: Record<string, ValidationStatus> = {};
    task.subtasks.forEach((subtask) => {
      if (subtask.type === "MULTIPLE_CHOICE") {
        initialResponses[subtask.id] = [];
      } else if (subtask.type === "RATING") {
        initialResponses[subtask.id] = null;
      } else {
        initialResponses[subtask.id] = "";
      }
      initialStatuses[subtask.id] = 'initial';
    });
    setResponses(initialResponses);
    setValidationStatuses(initialStatuses);

    const fetchAgentId = async () => {
      try {
        const id = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: contractAbi,
          functionName: 'publicAgentId',
        });
        if (id) setContractAgentId(id as bigint);
      } catch (error) {
        console.error("Error fetching public agent ID:", error);
        setContractAgentId(BigInt(130));
      }
    };
    fetchAgentId();
  }, [task]);

  const handleInputChange = (subtaskId: number, value: any) => {
    setResponses((prev) => ({ ...prev, [subtaskId]: value }));
    if (errors[subtaskId]) {
      setErrors((prev) => ({ ...prev, [subtaskId]: "" }));
    }
    // Reset validation status on change
    setValidationStatuses(prev => ({ ...prev, [subtaskId]: 'initial' }));
    setValidationReasons(prev => ({ ...prev, [subtaskId]: "" }));
  };

  const performAIValidation = async (subtaskId: number, question: string, answer: string) => {
    if (!answer || answer.trim().length < 2) return;
    
    setValidationStatuses(prev => ({ ...prev, [subtaskId]: 'validating' }));
    try {
      const result = await validateAnswer(question, answer);
      if (result.valid) {
        setValidationStatuses(prev => ({ ...prev, [subtaskId]: 'valid' }));
      } else {
        setValidationStatuses(prev => ({ ...prev, [subtaskId]: 'invalid' }));
        setValidationReasons(prev => ({ ...prev, [subtaskId]: result.reason || "Invalid response" }));
      }
    } catch (err) {
      console.error("Validation error:", err);
      // Fallback to valid if service fails
      setValidationStatuses(prev => ({ ...prev, [subtaskId]: 'valid' }));
    }
  };

  const handleFileUpload = (subtaskId: number, file: File | null) => {
    setFiles((prev) => ({ ...prev, [subtaskId]: file }));
    if (errors[subtaskId]) {
      setErrors((prev) => ({ ...prev, [subtaskId]: "" }));
    }
  };

  const handleRatingChange = (subtaskId: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [subtaskId]: rating }));
    setResponses((prev) => ({ ...prev, [subtaskId]: rating }));
    if (errors[subtaskId]) {
      setErrors((prev) => ({ ...prev, [subtaskId]: "" }));
    }
  };

  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};
    task.subtasks.forEach((subtask) => {
      if (subtask.required) {
        const response = responses[subtask.id];
        if (subtask.type === "FILE_UPLOAD") {
          if (!files[subtask.id]) newErrors[subtask.id] = "Please upload a file";
        } else if (subtask.type === "MULTIPLE_CHOICE") {
          if (!response || !Array.isArray(response) || response.length === 0) {
            newErrors[subtask.id] = "Please select at least one option";
          }
        } else if (subtask.type === "CHOICE_SELECTION") {
          if (!response || typeof response !== "string" || response.trim() === "") {
            newErrors[subtask.id] = "Please select an option";
          }
        } else if (subtask.type === "TEXT_INPUT" || subtask.type === "SURVEY") {
          if (!response || typeof response !== "string" || response.trim() === "") {
            newErrors[subtask.id] = "This field is required";
          } else if (validationStatuses[subtask.id] === 'invalid') {
            newErrors[subtask.id] = validationReasons[subtask.id] || "Invalid response";
          } else if (validationStatuses[subtask.id] === 'validating') {
            newErrors[subtask.id] = "Still validating...";
          }
        } else if (subtask.type === "RATING") {
          if (response === null || response === undefined) {
            newErrors[subtask.id] = "Please provide a rating";
          }
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) return;
    
    // Check if any required field is still being validated
    const stillValidating = task.subtasks.some(s => s.required && (s.type === 'TEXT_INPUT' || s.type === 'SURVEY') && validationStatuses[s.id] === 'validating');
    if (stillValidating) {
      toast.info("Please wait for AI validation to complete");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    setIsSubmitting(true);
    try {
      const userSubmission = await hasUserSubmittedToTask(address as string, task.id);
      if (userSubmission) {
        toast.error("You have already submitted for this task.");
        setIsSubmitting(false);
        router.push("/Start");
        return;
      }

      const totalRewardRaw = BigInt(task.baseReward);
      const totalRewardFormatted = Number(formatUnits(totalRewardRaw, 6));

      const payoutResult = await payoutTaskerAction(
        task.agentRequestId || "",
        address as string,
        totalRewardRaw.toString(),
        1
      );

      if (!payoutResult.success) {
        toast.error(`Payout failed: ${payoutResult.error}`);
        setIsSubmitting(false);
        return;
      }

      const paymentHash = payoutResult.txHash;
      toast.success("Reward paid out on-chain!");
      await updateEarnings(address as string, totalRewardRaw);

      setPaymentDetails({
        baseReward: totalRewardFormatted,
        bonusReward: 0,
        totalReward: totalRewardFormatted,
        aiRating: 10,
        explanation: "Automatic payout processed.",
        transactionHash: paymentHash,
      });
      setShowPaymentModal(true);

      setIsUploading(true);
      const subtaskResponses = await Promise.all(task.subtasks.map(async (subtask) => {
        let fileUrl = undefined;
        const file = files[subtask.id];
        if (file) {
          try {
            const formData = new FormData();
            formData.append("file", file);
            const cid = await uploadFileToIpfs(formData);
            fileUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
          } catch (error) {
            console.error(`Failed to upload file for subtask ${subtask.id}:`, error);
          }
        }
        return {
          subtaskId: subtask.id,
          response: JSON.stringify(responses[subtask.id]),
          fileUrl: fileUrl,
        };
      }));
      setIsUploading(false);

      await createTaskSubmissionWithResponses(
        task.id,
        address as string,
        subtaskResponses,
        10,
        "Automatic payout processed.",
        totalRewardFormatted.toString()
      );

      const submission: TaskSubmission = {
        taskId: task.id,
        subtaskResponses: task.subtasks.map((subtask) => ({
          subtaskId: subtask.id,
          response: responses[subtask.id],
          completed: true,
        })),
        totalScore: 10,
        feedback: "Automatic payout processed.",
        submittedAt: new Date().toISOString(),
      };
      setSubmissionResults(submission);

      const userDetails = await getUser(address as string);
      if (userDetails?.fid) {
        try {
          const { notifyUserOfPayment } = await import("@/lib/FarcasterNotify");
          await notifyUserOfPayment(userDetails.fid, totalRewardFormatted.toFixed(3));
        } catch (error) {
          console.error("Failed to send Farcaster notification:", error);
        }
      }

      if (onTaskCompleted) onTaskCompleted();
    } catch (error) {
      console.error("Error submitting task:", error);
      setErrors({ general: "Failed to submit task. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }
    setIsSubmittingFeedback(true);
    const loadingToast = toast.loading("Submitting feedback on-chain...");
    try {
      if (chain?.id !== celo.id) {
        toast.dismiss(loadingToast);
        toast.error(`Please switch your wallet to the Celo network.`);
        setIsSubmittingFeedback(false);
        return;
      }
      const hash = await writeContractAsync({
        address: reputationRegistryAddress as `0x${string}`,
        abi: reputationAbi,
        functionName: 'giveFeedback',
        args: [
          contractAgentId || BigInt(130),
          BigInt(agentRating),
          0,
          selectedCategory || "overall",
          "verified-worker",
          "",
          `${window.location.origin}/Task/${task.id}`,
          "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
        ],
      });
      toast.dismiss(loadingToast);
      toast.success("Feedback submitted on-chain!");
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowRatingModal(false);
        closeFormGenerator?.();
        router.push("/Start");
      }, 2000);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Feedback failed: ${error?.shortMessage || error?.message || "Unknown error"}`);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const renderSubtaskForm = (subtask: TaskWithEligibility["subtasks"][0]) => {
    const hasError = errors[subtask.id];
    const validationStatus = validationStatuses[subtask.id] || 'initial';
    const validationReason = validationReasons[subtask.id];

    switch (subtask.type) {
      case "TEXT_INPUT":
      case "SURVEY":
        return (
          <div className="space-y-2 relative">
            <div className="relative">
              <textarea
                value={responses[subtask.id] || ""}
                onChange={(e) => handleInputChange(subtask.id, e.target.value)}
                onBlur={(e) => performAIValidation(subtask.id, subtask.title, e.target.value)}
                placeholder={subtask.placeholder || "Enter your response..."}
                maxLength={subtask.maxLength || undefined}
                rows={3}
                className={`w-full px-3 py-2 border-2 border-black focus:border-celo-yellow transition-all resize-none text-sm font-inter pr-10 ${hasError ? "bg-celo-error text-white" : "bg-white text-black"}`}
              />
              <div className="absolute top-2 right-2">
                {validationStatus === 'validating' && <Loader2 className="w-5 h-5 animate-spin text-celo-purple" />}
                {validationStatus === 'valid' && <CheckCircle2 className="w-5 h-5 text-celo-forest" />}
                {validationStatus === 'invalid' && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>
            
            {validationStatus === 'invalid' && (
              <div className="text-[10px] font-bold text-red-600 bg-red-50 p-1 border border-red-200 rounded">
                AI Validation: {validationReason}
              </div>
            )}

            {hasError && validationStatus !== 'invalid' && (
              <div className="flex items-center space-x-2 text-white text-xs bg-celo-error p-2 border border-black">
                <AlertCircle className="w-3 h-3" />
                <span className="font-inter font-heavy">{hasError}</span>
              </div>
            )}
          </div>
        );
      case "MULTIPLE_CHOICE":
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              {subtask.options && JSON.parse(subtask.options).map((option: string, index: number) => {
                const isSelected = responses[subtask.id]?.includes(option) || false;
                return (
                  <label key={index} className={`flex items-center space-x-2 p-2 border-2 border-black cursor-pointer transition-all ${isSelected ? "bg-celo-forest text-white" : "bg-white text-black hover:bg-celo-dk-tan"}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const current = responses[subtask.id] || [];
                        handleInputChange(subtask.id, e.target.checked ? [...current, option] : current.filter((item: string) => item !== option));
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-inter flex-1">{option}</span>
                  </label>
                );
              })}
            </div>
            {hasError && (
              <div className="flex items-center space-x-2 text-white text-xs bg-celo-error p-2 border border-black">
                <AlertCircle className="w-3 h-3" />
                <span className="font-inter font-heavy">{hasError}</span>
              </div>
            )}
          </div>
        );
      case "FILE_UPLOAD":
        return (
          <div className="space-y-2">
            <div className={`border-2 border-black p-3 text-center transition-all ${files[subtask.id] ? "bg-celo-success text-white" : hasError ? "bg-celo-error text-white" : "bg-white text-black hover:bg-celo-dk-tan"}`}>
              <input type="file" onChange={(e) => handleFileUpload(subtask.id, e.target.files?.[0] || null)} className="hidden" id={`file-${subtask.id}`} />
              <label htmlFor={`file-${subtask.id}`} className="cursor-pointer font-bold text-sm">
                {files[subtask.id] ? files[subtask.id]?.name : "CHOOSE FILE"}
              </label>
            </div>
            {hasError && (
              <div className="flex items-center space-x-2 text-white text-xs bg-celo-error p-2 border border-black">
                <AlertCircle className="w-3 h-3" />
                <span className="font-inter font-heavy">{hasError}</span>
              </div>
            )}
          </div>
        );
      case "RATING":
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingChange(subtask.id, rating)}
                  className={`h-8 border-2 border-black flex items-center justify-center text-xs font-inter font-heavy transition-all ${responses[subtask.id] === rating ? "bg-celo-forest text-white" : "bg-white text-black hover:bg-celo-dk-tan"}`}
                >
                  {rating}
                </button>
              ))}
            </div>
            {hasError && (
              <div className="flex items-center space-x-2 text-white text-xs bg-celo-error p-2 border border-black">
                <AlertCircle className="w-3 h-3" />
                <span className="font-inter font-heavy">{hasError}</span>
              </div>
            )}
          </div>
        );
      case "CHOICE_SELECTION":
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              {subtask.options && JSON.parse(subtask.options).map((option: string, index: number) => {
                const isSelected = responses[subtask.id] === option;
                return (
                  <label key={index} className={`flex items-center space-x-2 p-2 border-2 border-black cursor-pointer transition-all ${isSelected ? "bg-celo-forest text-white" : "bg-white text-black hover:bg-celo-dk-tan"}`}>
                    <input
                      type="radio"
                      name={`choice-${subtask.id}`}
                      checked={isSelected}
                      onChange={() => handleInputChange(subtask.id, option)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-inter flex-1">{option}</span>
                  </label>
                );
              })}
            </div>
            {hasError && (
              <div className="flex items-center space-x-2 text-white text-xs bg-celo-error p-2 border border-black">
                <AlertCircle className="w-3 h-3" />
                <span className="font-inter font-heavy">{hasError}</span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const isValid = useMemo(() => {
    return task.subtasks.every((subtask) => {
      if (!subtask.required) return true;
      const response = responses[subtask.id];
      if (subtask.type === "FILE_UPLOAD") return !!files[subtask.id];
      if (subtask.type === "MULTIPLE_CHOICE") return response && response.length > 0;
      if (subtask.type === "RATING") return response !== null && response !== undefined;
      
      const textResponse = response && response.trim() !== "";
      if (!textResponse) return false;
      
      // Also check AI validation for text fields
      if (subtask.type === "TEXT_INPUT" || subtask.type === "SURVEY") {
        return validationStatuses[subtask.id] === 'valid';
      }
      
      return true;
    });
  }, [responses, files, task.subtasks, validationStatuses]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-celo-lt-tan to-white relative overflow-hidden">
      <div className="relative max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Task Header */}
        <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-gt-alpina font-extrabold text-black leading-tight">{task.title}</h1>
            <p className="text-gray-600 text-sm max-w-lg mx-auto">{task.description}</p>
            <div className="flex justify-center">
              <div className="bg-celo-forest/5 border-2 border-black rounded-xl px-6 py-3 text-center">
                <Trophy className="w-6 h-6 text-celo-forest mx-auto mb-1" />
                <div className="text-xl font-extrabold text-celo-forest">{formatUnits(BigInt(task.baseReward), 6)} USDC</div>
                <div className="text-[10px] font-black text-black uppercase tracking-widest">Reward</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtasks Section - Single Page */}
        <div className="space-y-6">
          {task.subtasks.map((subtask, index) => (
            <div key={subtask.id} className="bg-white border-2 border-black rounded-xl transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black text-lg font-black bg-celo-yellow text-black flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-black text-lg">{subtask.title}</h3>
                      {subtask.required && <Star className="w-4 h-4 text-celo-orange fill-celo-orange" />}
                    </div>
                    <p className="text-gray-500 text-sm font-medium">{subtask.description}</p>
                  </div>
                </div>
                {renderSubtaskForm(subtask)}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Section */}
        <div className="pt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="w-full py-4 bg-celo-orange text-white border-4 border-black rounded-xl font-black text-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-celo-orange transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{isUploading ? "UPLOADING..." : "SUBMITTING..."}</span>
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                <span>SUBMIT TASK</span>
              </>
            )}
          </button>
          
          {!isValid && (
            <p className="text-center text-[10px] font-black text-celo-body mt-4 uppercase tracking-tighter">
              Complete all required fields with valid input to submit
            </p>
          )}
        </div>

        {/* Status Messages */}
        {submissionResults && (
          <div className="bg-celo-success border-4 border-black p-4 rounded-xl">
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-black uppercase text-sm">Task Submitted Successfully!</span>
            </div>
          </div>
        )}
        {errors.general && (
          <div className="bg-celo-error border-4 border-black p-4 rounded-xl">
            <div className="flex items-center space-x-3 text-white">
              <AlertCircle className="w-6 h-6" />
              <span className="font-black text-sm uppercase tracking-tight">{errors.general}</span>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showPaymentModal && paymentDetails && paymentDetails.transactionHash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 1000} height={typeof window !== 'undefined' ? window.innerHeight : 1000} recycle={false} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border-4 border-black rounded-2xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-sm w-full overflow-hidden">
            <div className="bg-celo-forest text-white text-center py-8 px-4 border-b-4 border-black">
              <div className="w-20 h-20 bg-white/20 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black italic">PAID! 🎉</h3>
              <p className="text-sm font-bold opacity-90 mt-2">WE JUST SENT USDC TO YOUR WALLET</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-celo-lt-tan border-2 border-black rounded-xl p-5 space-y-3 shadow-inner">
                <div className="flex justify-between items-center border-b-2 border-black/5 pb-2">
                  <span className="font-black text-xs uppercase text-gray-500">Amount</span>
                  <span className="font-black text-lg text-celo-forest">{paymentDetails.totalReward.toFixed(3)} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs uppercase text-gray-500">Tx Hash</span>
                  <span className="font-mono text-[10px] font-bold bg-white px-2 py-1 border border-black/10 rounded">{paymentDetails.transactionHash.slice(0, 14)}...</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    if (isFarcaster) {
                      closeFormGenerator?.();
                      router.push("/Start");
                    } else {
                      setShowRatingModal(true);
                    }
                  }}
                  className="w-full bg-celo-success text-white border-2 border-black py-4 rounded-xl font-black text-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                  DONE
                </button>
                <button
                  onClick={() => window.open(`https://celoscan.io/tx/${paymentDetails.transactionHash}`, "_blank")}
                  className="w-full bg-white text-black border-2 border-black py-2 rounded-xl font-bold text-xs"
                >
                  EXPLORER
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border-4 border-black rounded-2xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-sm w-full p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black">RATE IT!</h3>
              <p className="text-sm font-medium text-gray-500 leading-tight">HOW WAS YOUR EXPERIENCE WITH THIS TASK?</p>
            </div>
            {!feedbackSubmitted ? (
              <>
                <div className="space-y-4">
                  <input type="range" min="0" max="100" value={agentRating} onChange={(e) => setAgentRating(parseInt(e.target.value))} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-celo-purple border-2 border-black" />
                  <div className="text-center font-black text-3xl text-celo-purple">{agentRating}</div>
                </div>
                <button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback} className="w-full bg-celo-orange text-white border-4 border-black py-4 rounded-xl font-black text-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black transition-all">
                  {isSubmittingFeedback ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
                </button>
                <button onClick={() => { setShowRatingModal(false); closeFormGenerator?.(); router.push("/Start"); }} className="w-full text-gray-400 font-black text-[10px] uppercase tracking-tighter hover:text-black">Skip for now</button>
              </>
            ) : (
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 bg-celo-success rounded-full flex items-center justify-center mx-auto border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <p className="font-black text-xl">THANK YOU!</p>
                  <p className="text-sm font-medium text-gray-500">YOUR FEEDBACK HELPS THE AGENT GROW.</p>
                </div>
                <button onClick={() => { setShowRatingModal(false); closeFormGenerator?.(); router.push("/Start"); }} className="w-full bg-black text-white py-4 rounded-xl font-black text-lg">FINISH</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
