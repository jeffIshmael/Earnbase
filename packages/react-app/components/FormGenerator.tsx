"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TaskWithEligibility } from "@/lib/taskService";
import { getAiRating } from "@/lib/AiRating";
import {
  FileText,
  CheckCircle,
  Target,
  Star,
  Users,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Save,
  Eye,
  EyeOff,
  Zap,
  Trophy,
  Clock,
  X,
  Sparkles,
  Coins,
  Gift,
  Receipt,
  User,
  Hash,
  SquareArrowOutUpRight,
  ArrowUpRight
} from "lucide-react";
import { makePaymentToUser } from "@/lib/WriteFunctions";
import { useAccount, useWriteContract } from "wagmi";
import { toast } from "sonner";
import Confetti from "react-confetti";
import {
  createTaskSubmissionWithResponses,
  updateEarnings,
  hasUserSubmittedToTask,
  getUser,
} from "@/lib/Prismafnctns";
import { parseUnits, formatUnits } from "viem";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getTask } from "@/lib/ReadFunctions";
import { sendFarcasterNotification } from "@/lib/FarcasterNotify";
import { payoutTaskerAction } from "@/lib/payoutActions";
import { uploadFileToIpfs } from "@/lib/ipfs";
import { reputationAbi, reputationRegistryAddress } from "@/blockchain/constants";
import { prepareContractCall, getContract, sendTransaction, createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";

const twClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

interface FormGeneratorProps {
  task: TaskWithEligibility;
  onTaskCompleted?: () => void;
  closeFormGenerator?: () => void;
  // onComplete?: (results: TaskSubmission) => void;
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

export default function FormGenerator({
  task,
  onTaskCompleted,
  closeFormGenerator,
}: FormGeneratorProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const { address } = useAccount();
  const [feedback, setFeedback] = useState("");
  const [feedbackLength, setFeedbackLength] = useState(0);
  const MAX_FEEDBACK_LENGTH = 500;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionResults, setSubmissionResults] =
    useState<TaskSubmission | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    baseReward: number;
    bonusReward: number;
    totalReward: number;
    aiRating: number;
    explanation: string;
    transactionHash?: string;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [taskBalance, setTaskBalance] = useState(0);
  const { isConnected } = useAccount();
  const router = useRouter();

  // On-chain Feedback State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("RLHF");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [agentRating, setAgentRating] = useState(100);
  const [isUploading, setIsUploading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // Initialize responses for all subtasks
  useEffect(() => {
    const initialResponses: Record<string, any> = {};
    task.subtasks.forEach((subtask) => {
      if (subtask.type === "MULTIPLE_CHOICE") {
        initialResponses[subtask.id] = [];
      } else if (subtask.type === "RATING") {
        initialResponses[subtask.id] = null; // No default rating
      } else {
        initialResponses[subtask.id] = "";
      }
    });
    setResponses(initialResponses);
  }, [task]);

  // getting task balance
  const getTaskBalance = async () => {
    const thisTaskBalance = await getTask(BigInt(task.blockChainId));
    setTaskBalance(
      Number(thisTaskBalance.totalAmount - thisTaskBalance.paidAmount) /
      Math.pow(10, 18)
    );
    return (
      Number(thisTaskBalance.totalAmount - thisTaskBalance.paidAmount) /
      Math.pow(10, 18)
    );
  };

  const handleInputChange = (subtaskId: number, value: any) => {
    setResponses((prev) => ({ ...prev, [subtaskId]: value }));

    // Clear error when user starts typing
    if (errors[subtaskId]) {
      setErrors((prev) => ({ ...prev, [subtaskId]: "" }));
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

  const handleFeedbackChange = (value: string) => {
    if (value.length <= MAX_FEEDBACK_LENGTH) {
      setFeedback(value);
      setFeedbackLength(value.length);
    }
  };

  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};

    task.subtasks.forEach((subtask) => {
      if (subtask.required) {
        const response = responses[subtask.id];

        if (subtask.type === "FILE_UPLOAD") {
          if (!files[subtask.id]) {
            newErrors[subtask.id] = "Please upload a file";
          }
        } else if (subtask.type === "MULTIPLE_CHOICE") {
          if (!response || !Array.isArray(response) || response.length === 0) {
            newErrors[subtask.id] = "Please select at least one option";
          }
        } else if (subtask.type === "CHOICE_SELECTION") {
          if (
            !response ||
            typeof response !== "string" ||
            response.trim() === ""
          ) {
            newErrors[subtask.id] = "Please select an option";
          }
        } else if (subtask.type === "TEXT_INPUT" || subtask.type === "SURVEY") {
          if (
            !response ||
            typeof response !== "string" ||
            response.trim() === ""
          ) {
            newErrors[subtask.id] = "This field is required";
          } else if (subtask.maxLength && response.length > subtask.maxLength) {
            newErrors[
              subtask.id
            ] = `Maximum ${subtask.maxLength} characters allowed`;
          }
        } else if (subtask.type === "RATING") {
          if (
            response === null ||
            response === undefined ||
            typeof response !== "number" ||
            response < 1 ||
            response > 10
          ) {
            newErrors[subtask.id] = "Please provide a rating";
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) {
      return;
    }
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    setIsSubmitting(true);

    try {
      // check whether the user has already submitted the task
      const userSubmission = await hasUserSubmittedToTask(
        address as string,
        task.id
      );
      if (userSubmission) {
        toast.error("You have already submitted for this task.");
        setIsSubmitting(false);
        return;
      }

      // Process rewards directly
      const baseRewardRaw = BigInt(task.baseReward);
      const totalRewardRaw = baseRewardRaw; // AI bonus removed from UI flow
      const totalRewardFormatted = Number(formatUnits(totalRewardRaw, 6));

      // Make payment to user via new on-chain payout action
      console.log(`💸 Initiating automated payout for task ${task.id} (Agent ID: ${task.agentRequestId})`);
      const payoutResult = await payoutTaskerAction(
        task.agentRequestId || "",
        address as string,
        totalRewardRaw.toString(),
        1 // Default reputation weight
      );

      if (!payoutResult.success) {
        toast.error(`Payout failed: ${payoutResult.error}`);
        setIsSubmitting(false);
        return;
      }

      const paymentHash = payoutResult.txHash;
      toast.success("Reward paid out on-chain!");

      // Update earnings (USDC uses 6 decimals)
      await updateEarnings(
        address as string,
        totalRewardRaw
      );

      // Set payment details for success screen
      setPaymentDetails({
        baseReward: totalRewardFormatted,
        bonusReward: 0,
        totalReward: totalRewardFormatted,
        aiRating: 10, // Default to 10 if removed from UI
        explanation: "Automatic payout processed.",
        transactionHash: paymentHash,
      });

      setShowPaymentModal(true);

      // Upload files to IPFS and prepare submission data
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
            console.log(`Subtask ${subtask.id} file uploaded: ${fileUrl}`);
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

      // Save submission to database
      const dbSubmission = await createTaskSubmissionWithResponses(
        task.id,
        address as string,
        subtaskResponses,
        10, // Default rating
        "Automatic payout processed.",
        totalRewardFormatted.toString()
      );

      if (!dbSubmission) {
        throw new Error("Failed to save submission to database");
      }

      // Prepare submission data for UI
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

      // Store submission results
      setSubmissionResults(submission);

      // Fetch user details to send a Farcaster notification
      const userDetails = await getUser(address as string);

      if (userDetails?.fid) {
        try {
          await sendFarcasterNotification(
            [userDetails.fid],
            "💵 Reward Received!",
            `You’ve just earned ${totalRewardFormatted.toFixed(
              3
            )} USDC for completing “${task.title
            }” on Earnbase. Keep sharing valuable feedback and earn more!`
          );
        } catch (error) {
          console.error("Failed to send Farcaster notification:", error);
        }
      }

      // Notify parent component that task was completed
      if (onTaskCompleted) {
        onTaskCompleted();
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      setErrors({ general: "Failed to submit task. Please try again." });
      setIsSubmitting(false);
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
    try {
      toast.loading("Submitting feedback on-chain...");

      const hash = await writeContractAsync({
        address: reputationRegistryAddress as `0x${string}`,
        abi: reputationAbi,
        functionName: 'giveFeedback',
        args: [
          BigInt(130), // agentId
          BigInt(agentRating), // value
          0, // valueDecimals
          selectedCategory, // tag1
          "verified-worker", // tag2
          "", // endpoint
          `https://earnbase.vercel.app/tasks/${task.id}`, // feedbackURI
          "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // feedbackHash
        ],
      });

      console.log("Feedback submitted:", hash);
      toast.dismiss();
      toast.success("Feedback submitted on-chain!");
      setFeedbackSubmitted(true);
    } catch (error: any) {
      console.error("Feedback error:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const renderSubtaskForm = (subtask: TaskWithEligibility["subtasks"][0]) => {
    const hasError = errors[subtask.id];
    const isRequired = subtask.required;

    switch (subtask.type) {
      case "TEXT_INPUT":
        return (
          <div className="space-y-2">
            <textarea
              value={responses[subtask.id] || ""}
              onChange={(e) => handleInputChange(subtask.id, e.target.value)}
              placeholder={subtask.placeholder || "Enter your response..."}
              maxLength={subtask.maxLength || undefined}
              rows={2}
              className={`w-full px-3 py-2 border-2 border-black focus:border-celo-yellow transition-all resize-none text-sm font-inter ${hasError ? "bg-celo-error text-white" : "bg-white text-black"
                }`}
            />
            {subtask.maxLength && (
              <div className="text-xs">
                <div
                  className={`font-inter ${responses[subtask.id]?.length > subtask.maxLength * 0.9
                    ? "text-celo-orange"
                    : "text-celo-body"
                    }`}
                >
                  {responses[subtask.id]?.length || 0}/{subtask.maxLength}{" "}
                  characters
                </div>
              </div>
            )}
            {hasError && (
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
              {subtask.options
                ? JSON.parse(subtask.options).map(
                  (option: string, index: number) => {
                    const isSelected =
                      responses[subtask.id]?.includes(option) || false;
                    return (
                      <label
                        key={index}
                        className={`flex items-center space-x-2 p-2 border-2 border-black cursor-pointer transition-all ${isSelected
                          ? "bg-celo-forest text-white"
                          : "bg-white text-black hover:bg-celo-dk-tan"
                          }`}
                      >
                        <div
                          className={`w-4 h-4 border border-black flex items-center justify-center transition-all ${isSelected ? "bg-black" : "bg-white"
                            }`}
                        >
                          {isSelected && (
                            <CheckCircle2 className="w-2 h-2 text-celo-yellow" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const current = responses[subtask.id] || [];
                            if (e.target.checked) {
                              handleInputChange(subtask.id, [
                                ...current,
                                option,
                              ]);
                            } else {
                              handleInputChange(
                                subtask.id,
                                current.filter(
                                  (item: string) => item !== option
                                )
                              );
                            }
                          }}
                          className="sr-only"
                        />
                        <span className="text-xs font-inter flex-1">
                          {option}
                        </span>
                      </label>
                    );
                  }
                )
                : null}
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
            <div
              className={`border-2 border-black p-3 text-center transition-all ${files[subtask.id]
                ? "bg-celo-success text-white"
                : hasError
                  ? "bg-celo-error text-white"
                  : "bg-white text-black hover:bg-celo-dk-tan"
                }`}
            >
              <div className="space-y-1">
                {files[subtask.id] ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-white mx-auto" />
                    <p className="text-xs font-inter font-heavy">
                      {files[subtask.id]?.name}
                    </p>
                    <p className="text-xs font-inter">FILE UPLOADED!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-black mx-auto" />
                    <p className="text-xs font-inter">
                      <span className="font-heavy text-white">
                        TAP TO UPLOAD
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="*/*"
                onChange={(e) =>
                  handleFileUpload(subtask.id, e.target.files?.[0] || null)
                }
                className="hidden"
                id={`file-${subtask.id}`}
              />
              <label
                htmlFor={`file-${subtask.id}`}
                className="mt-2 inline-flex items-center px-3 py-1 text-xs font-inter font-heavy border-2 border-black bg-celo-purple text-white hover:bg-black hover:text-gray-300 transition-all cursor-pointer"
              >
                {files[subtask.id] ? "CHANGE FILE" : "CHOOSE FILE"}
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
                  className={`h-8 border-2 border-black flex items-center justify-center text-xs font-inter font-heavy transition-all active:scale-95 ${responses[subtask.id] === rating
                    ? "bg-celo-forest text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    : "bg-white text-black hover:bg-celo-dk-tan"
                    }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="text-center">
              <div className="text-xs font-inter">
                {responses[subtask.id] ? (
                  <span className="font-heavy text-celo-purple">
                    RATING: {responses[subtask.id]}/5
                  </span>
                ) : (
                  "TAP A NUMBER TO RATE"
                )}
              </div>
            </div>
            {hasError && (
              <div className="flex items-center space-x-2 text-white text-xs bg-celo-error p-2 border border-black">
                <AlertCircle className="w-3 h-3" />
                <span className="font-inter font-heavy">{hasError}</span>
              </div>
            )}
          </div>
        );

      case "SURVEY":
        return (
          <div className="space-y-2">
            <textarea
              value={responses[subtask.id] || ""}
              onChange={(e) => handleInputChange(subtask.id, e.target.value)}
              placeholder="Share your detailed thoughts..."
              rows={3}
              className={`w-full px-3 py-2 border-2 border-black focus:border-celo-yellow transition-all resize-none text-sm font-inter ${hasError ? "bg-celo-error text-white" : "bg-white text-black"
                }`}
            />
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
              {subtask.options
                ? JSON.parse(subtask.options).map(
                  (option: string, index: number) => {
                    const isSelected = responses[subtask.id] === option;
                    return (
                      <label
                        key={index}
                        className={`flex items-center space-x-2 p-2 border-2 border-black cursor-pointer transition-all ${isSelected
                          ? "bg-celo-forest text-white"
                          : "bg-white text-black hover:bg-celo-dk-tan"
                          }`}
                      >
                        <div
                          className={`w-4 h-4 border border-black flex items-center justify-center transition-all ${isSelected ? "bg-black" : "bg-white"
                            }`}
                        >
                          {isSelected && (
                            <CheckCircle2 className="w-2 h-2 text-celo-yellow" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name={`choice-${subtask.id}`}
                          checked={isSelected}
                          onChange={() =>
                            handleInputChange(subtask.id, option)
                          }
                          className="sr-only"
                        />
                        <span className="text-xs font-inter flex-1">
                          {option}
                        </span>
                      </label>
                    );
                  }
                )
                : null}
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "hard":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Memoize validation result to prevent infinite re-renders
  const isValid = useMemo(() => {
    const newErrors: Record<string, string> = {};

    task.subtasks.forEach((subtask) => {
      if (subtask.required) {
        const response = responses[subtask.id];

        if (subtask.type === "FILE_UPLOAD") {
          if (!files[subtask.id]) {
            newErrors[subtask.id] = "Please upload a file";
          }
        } else if (subtask.type === "MULTIPLE_CHOICE") {
          if (!response || !Array.isArray(response) || response.length === 0) {
            newErrors[subtask.id] = "Please select at least one option";
          }
        } else if (subtask.type === "CHOICE_SELECTION") {
          if (
            !response ||
            typeof response !== "string" ||
            response.trim() === ""
          ) {
            newErrors[subtask.id] = "Please select an option";
          }
        } else if (subtask.type === "TEXT_INPUT" || subtask.type === "SURVEY") {
          if (
            !response ||
            typeof response !== "string" ||
            response.trim() === ""
          ) {
            newErrors[subtask.id] = "This field is required";
          } else if (subtask.maxLength && response.length > subtask.maxLength) {
            newErrors[
              subtask.id
            ] = `Maximum ${subtask.maxLength} characters allowed`;
          }
        } else if (subtask.type === "RATING") {
          if (
            response === null ||
            response === undefined ||
            typeof response !== "number" ||
            response < 1 ||
            response > 10
          ) {
            newErrors[subtask.id] = "Please provide a rating";
          }
        }
      }
    });

    return Object.keys(newErrors).length === 0;
  }, [responses, files, task.subtasks]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-celo-lt-tan to-white relative overflow-hidden">
      <div className="relative max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Task Header */}
        <div className="bg-white border-4 border-black rounded-xl p-4 shadow-lg">
          <div className="space-y-3">
            <h1 className="text-xl font-gt-alpina font-bold text-black leading-tight">
              {task.title}
            </h1>
            <p className="text-gray-600 text-sm">{task.description}</p>

            <div className="flex justify-center">
              <div className="bg-white border-2 border-black rounded-lg px-4 py-2 text-center">
                <Trophy className="w-5 h-5 text-celo-forest mx-auto mb-1" />
                <div className="text-lg font-bold text-celo-forest">
                  {formatUnits(BigInt(task.baseReward), 6)} USDC
                </div>
                <div className="text-xs font-semibold text-black">REWARD</div>
              </div>
            </div>
          </div>
        </div>
        {/* Subtasks Section */}
        <div className="space-y-3">
          {task.subtasks.map((subtask, index) => {
            return (
              <div
                key={subtask.id}
                className="bg-white border-2 border-black rounded-lg transition-all hover:shadow-md"
              >
                <div className="p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-black text-xs font-bold bg-celo-forest text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-black text-sm">
                          {subtask.title}
                        </h3>
                        {subtask.required && (
                          <Star className="w-4 h-4 text-celo-orange bg-white" />
                        )}
                      </div>
                      <p className="text-gray-600 text-xs mt-1">
                        {subtask.description}
                      </p>
                    </div>
                  </div>
                  {renderSubtaskForm(subtask)}
                </div>
              </div>
            );
          })}
        </div>
        {/* Submit Button */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="w-full flex items-center justify-center gap-2 py-3 bg-celo-yellow border-4 border-black rounded-lg 
            font-semibold text-black hover:bg-celo-purple hover:text-celo-yellow transition-all duration-200 
            disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isUploading ? "Uploading to IPFS..." : "Submitting..."}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Task</span>
              </>
            )}
          </button>

          {/* Validation Status */}
          {!isValid && (
            <div className="mt-2 text-center">
              <p className="text-xs text-celo-body font-inter">
                Please complete all required fields to submit
              </p>
            </div>
          )}
        </div>
        {/* Success Message */}{" "}
        {submissionResults && (
          <div className="bg-celo-success border-4 border-black p-4 mb-4">
            {" "}
            <div className="flex items-center space-x-2 text-white">
              {" "}
              <CheckCircle2 className="w-5 h-5" />{" "}
              <span className="font-inter font-heavy">
                TASK SUBMITTED SUCCESSFULLY! CHECK YOUR WALLET FOR THE REWARD.
              </span>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* General Error Display */}{" "}
        {errors.general && (
          <div className="bg-celo-error border-4 border-black p-4">
            {" "}
            <div className="flex items-center space-x-2 text-white">
              {" "}
              <AlertCircle className="w-5 h-5" />{" "}
              <span className="font-inter font-heavy">{errors.general}</span>{" "}
            </div>{" "}
          </div>
        )}
      </div>



      {/* Success Modal */}
      {showPaymentModal && paymentDetails && paymentDetails.transactionHash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/70 to-black/50 backdrop-blur-md p-4">
          <Confetti width={1000} height={1000} recycle={false} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="bg-white border-4 border-black rounded-2xl shadow-[10px_10px_0_0_rgba(0,0,0,1)] max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-celo-forest text-white text-center py-6 px-4 relative">
              <div className="w-20 h-20 bg-white/20 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-gt-alpina font-bold mb-1">
                Payment Successful! 🎉
              </h3>
              <p className="text-white/90 font-inter">
                Your reward has been credited
              </p>
            </div>

            {/* Receipt & Feedback Container */}
            <div className="p-6 space-y-6">
              <div className="bg-celo-lt-tan border-4 border-black rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-gt-alpina font-bold text-lg flex items-center">
                    <Receipt className="w-5 h-5 mr-2" /> Transaction Receipt
                  </h4>
                  <span className="text-xs bg-white border-2 border-black px-2 py-1 font-inter">
                    {new Date().toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3 text-sm font-inter">
                  <div className="flex justify-between border-b-2 border-black pb-2">
                    <span className="font-bold flex items-center">
                      <User className="w-4 h-4 mr-2" /> Recipient
                    </span>
                    <span className="font-mono bg-celo-blue text-white border-2 border-black px-2 py-1 rounded">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b-2 border-black pb-2">
                    <span className="font-bold flex items-center">
                      <Hash className="w-4 h-4 mr-2" /> Transaction
                    </span>
                    <span className="font-mono bg-celo-success text-white border-2 border-black px-2 py-1 rounded">
                      {paymentDetails?.transactionHash.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-celo-forest text-white px-3 py-3 border-2 border-black">
                    <span className="font-gt-alpina text-lg font-bold">
                      Total Paid
                    </span>
                    <span className="text-xl font-gt-alpina font-bold">
                      {paymentDetails.totalReward.toFixed(3)} USDC
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setResponses({});
                    setPaymentDetails(null);

                    // Guard against self-feedback error
                    const isTaskCreator = address?.toLowerCase() === task.creator?.walletAddress?.toLowerCase();
                    if (isTaskCreator) {
                      toast.info("Self-feedback is not allowed for this contract.");
                      closeFormGenerator?.();
                      router.push("/Start");
                    } else {
                      setShowRatingModal(true);
                    }
                  }}
                  className="flex-1 bg-celo-success text-white border-4 border-black rounded-xl py-3 font-semibold shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-celo-success transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://celoscan.io/tx/${paymentDetails?.transactionHash}`,
                      "_blank"
                    )
                  }
                  className="flex justify-center gap-1 bg-celo-blue text-white border-4 border-black rounded-xl py-3 font-semibold shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-celo-blue transition-all"
                >
                  View on Chain <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rating Modal - Small separate modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-4 border-black rounded-2xl shadow-[10px_10px_0_0_rgba(0,0,0,1)] max-w-sm w-full overflow-hidden"
          >
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-gt-alpina font-bold">Agent Rating</h3>
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    closeFormGenerator?.();
                    router.push("/Start");
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!feedbackSubmitted ? (
                <>
                  <p className="text-sm font-inter text-gray-600">
                    How would you categorize this task for the agent&apos;s reputation?
                  </p>

                  <div className="space-y-4">
                    <div className="bg-gray-50 border-2 border-black rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-heavy">AGENT RATING</span>
                        <span className={`text-lg font-bold ${agentRating >= 70 ? 'text-celo-forest' : agentRating >= 40 ? 'text-celo-orange' : 'text-celo-error'}`}>
                          {agentRating}/100
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={agentRating}
                        onChange={(e) => setAgentRating(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-celo-purple border border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span>POOR</span>
                        <span>EXCELLENT</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "RLHF", label: "RLHF", icon: <Zap className="w-3 h-3" /> },
                      { id: "User Feedback", label: "User Feedback", icon: <User className="w-3 h-3" /> },
                      { id: "Tagging", label: "Tagging", icon: <Hash className="w-3 h-3" /> },
                      { id: "Data Labeling", label: "Data Labeling", icon: <FileText className="w-3 h-3" /> },
                      { id: "Content", label: "Content", icon: <Sparkles className="w-3 h-3" /> },
                      { id: "Verification", label: "Verification", icon: <CheckCircle2 className="w-3 h-3" /> },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 border-black text-xs font-heavy transition-all ${selectedCategory === cat.id
                          ? "bg-celo-purple text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] -translate-y-0.5"
                          : "bg-white text-black hover:bg-celo-yellow hover:-translate-y-0.5"
                          }`}
                      >
                        {/* {cat.icon} */}
                        <span className="truncate">{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmittingFeedback}
                    className="w-full bg-celo-orange text-white border-4 border-black py-4 rounded-xl font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>SUBMITTING...</span>
                      </>
                    ) : (
                      <>
                        {/* <Sparkles className="w-5 h-5" /> */}
                        <span>SUBMIT RATING</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="bg-celo-success/10 border-2 border-celo-success rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-celo-success rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-celo-forest font-heavy text-lg">Thank You!</p>
                    <p className="text-celo-body text-sm font-inter">Your feedback has been recorded.</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRatingModal(false);
                      closeFormGenerator?.();
                      router.push("/Start");
                    }}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-celo-forest transition-colors"
                  >
                    FINISH
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
