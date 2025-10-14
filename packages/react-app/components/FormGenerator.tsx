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
} from "lucide-react";
import { makePaymentToUser } from "@/lib/WriteFunctions";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import Confetti from "react-confetti";
import {
  createTaskSubmissionWithResponses,
  updateEarnings,
  hasUserSubmittedToTask,
} from "@/lib/Prismafnctns";
import { sendWhatsappResponse } from "@/lib/Whatsapp";
import { sendEmailResponse } from "@/lib/Email";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getTask } from "@/lib/ReadFunctions";

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
  const [aiRating, setAiRating] = useState<{
    rating: number;
    explanation: string;
  } | null>(null);
  const [showAiRatingModal, setShowAiRatingModal] = useState(false);
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
    const taskBalance = await getTask(BigInt(task.blockChainId));
    setTaskBalance(
      Number(taskBalance.totalAmount - taskBalance.paidAmount) /
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
    // check whether the user has already submitted the task
    const userSubmission = await hasUserSubmittedToTask(
      address as string,
      task.id
    );
    if (userSubmission) {
      toast.error("You have already submitted for this task");
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackToCreator = task.subtasks
        .filter((subtask) => responses[subtask.id])
        .map((subtask) => {
          const response = responses[subtask.id];
          let formattedResponse = "";

          // Format response based on type
          if (Array.isArray(response)) {
            // Multiple choice responses
            formattedResponse = response.join(", ");
          } else if (typeof response === "number") {
            // Rating responses
            formattedResponse = `${response}/10`;
          } else if (typeof response === "string") {
            // Text responses
            formattedResponse = response;
          } else {
            formattedResponse = String(response);
          }

          return `📝 ${subtask.title}\n💬 ${formattedResponse}`;
        })
        .join("\n\n");

      // Get AI rating for feedback
      const feedbackText = feedbackToCreator.trim() || "No feedback provided";
      const rating = await getAiRating(
        "user-" + Date.now(),
        feedbackText,
        task.aiCriteria
      );

      // Calculate rewards
      const baseReward = Number(task.baseReward) / Math.pow(10, 18);
      const maxBonusReward = Number(task.maxBonusReward) / Math.pow(10, 18);
      const bonusReward = ((rating?.rating || 1) * maxBonusReward) / 10;
      const totalReward = baseReward + bonusReward;

      // Set payment details
      const newPaymentDetails = {
        baseReward: baseReward,
        bonusReward: bonusReward,
        totalReward: totalReward,
        aiRating: rating?.rating || 1,
        explanation: rating?.explanation || "No explanation provided",
      };

      setAiRating(rating);
      setPaymentDetails(newPaymentDetails);
      setShowAiRatingModal(true);

      // Make payment to user
      const paymentHash = await makePaymentToUser(
        totalReward.toString(),
        address as `0x${string}`,
        Number(task.blockChainId)
      );

      if (!paymentHash) {
        toast.error("Payment failed");
        setIsSubmitting(false);
        return;
      }

      // Update earnings
      await updateEarnings(
        address as string,
        BigInt(totalReward * Math.pow(10, 18))
      );

      // Update payment details with transaction hash
      const updatedPaymentDetails = {
        ...newPaymentDetails,
        transactionHash: paymentHash,
      };
      setPaymentDetails(updatedPaymentDetails);

      // Close AI rating modal and show payment modal
      setShowAiRatingModal(false);
      setShowPaymentModal(true);

      // Prepare submission data for database
      const subtaskResponses = task.subtasks.map((subtask) => ({
        subtaskId: subtask.id,
        response: JSON.stringify(responses[subtask.id]),
        fileUrl: files[subtask.id] ? files[subtask.id]?.name : undefined,
      }));

      // Save submission to database
      const dbSubmission = await createTaskSubmissionWithResponses(
        task.id,
        address as string,
        subtaskResponses,
        rating?.rating || 1,
        rating?.explanation || "No explanation provided",
        totalReward.toString()
      );

      if (!dbSubmission) {
        throw new Error("Failed to save submission to database");
      }

      // get task balance
      await getTaskBalance();

      // Send notification to creator based on contact method
      const notificationData = {
        taskTitle: task.title,
        participant:
          address?.slice(0, 6) + "..." + address?.slice(-4) || "Unknown",
        response: feedbackToCreator,
        aiRating: (rating?.rating || 1).toString(),
        Reward: totalReward.toFixed(3).toString(),
        TaskBalance: taskBalance.toFixed(3),
      };

      if (task.contactMethod === "WHATSAPP" && task.contactInfo) {
        try {
          await sendWhatsappResponse({
            ...notificationData,
            creatorPhoneNo: task.contactInfo,
          });

          console.log("WhatsApp notification sent to creator");
        } catch (whatsappError) {
          console.error("Failed to send WhatsApp notification:", whatsappError);
          // toast.error('Task submitted but failed to notify creator via WhatsApp');
        }
      } else if (task.contactMethod === "EMAIL" && task.contactInfo) {
        try {
          await sendEmailResponse({
            ...notificationData,
            creatorEmail: task.contactInfo,
          });

          console.log("Email notification sent to creator");
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          toast.error("Task submitted but failed to notify creator via email");
        }
      }

      // Prepare submission data for UI
      const submission: TaskSubmission = {
        taskId: task.id,
        subtaskResponses: task.subtasks.map((subtask) => ({
          subtaskId: subtask.id,
          response: responses[subtask.id],
          completed: true,
        })),
        totalScore: rating?.rating || 1,
        feedback: feedbackText,
        submittedAt: new Date().toISOString(),
      };

      // Store submission results
      setSubmissionResults(submission);

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
              className={`w-full px-3 py-2 border-2 border-black focus:border-celo-yellow transition-all resize-none text-sm font-inter ${
                hasError ? "bg-celo-error text-white" : "bg-white text-black"
              }`}
            />
            {subtask.maxLength && (
              <div className="text-xs">
                <div
                  className={`font-inter ${
                    responses[subtask.id]?.length > subtask.maxLength * 0.9
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
                          className={`flex items-center space-x-2 p-2 border-2 border-black cursor-pointer transition-all ${
                            isSelected
                              ? "bg-celo-forest text-white"
                              : "bg-white text-black hover:bg-celo-dk-tan"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 border border-black flex items-center justify-center transition-all ${
                              isSelected ? "bg-black" : "bg-white"
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
              className={`border-2 border-black p-3 text-center transition-all ${
                files[subtask.id]
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
                      <span className="font-heavy text-celo-purple">
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
                className="mt-2 inline-flex items-center px-3 py-1 text-xs font-inter font-heavy border-2 border-black bg-celo-purple hover:bg-black hover:text-celo-purple transition-all cursor-pointer"
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingChange(subtask.id, rating)}
                  className={`h-8 border-2 border-black flex items-center justify-center text-xs font-inter font-heavy transition-all active:scale-95 ${
                    responses[subtask.id] === rating
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
                    RATING: {responses[subtask.id]}/10
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
              className={`w-full px-3 py-2 border-2 border-black focus:border-celo-yellow transition-all resize-none text-sm font-inter ${
                hasError ? "bg-celo-error text-white" : "bg-white text-black"
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
                          className={`flex items-center space-x-2 p-2 border-2 border-black cursor-pointer transition-all ${
                            isSelected
                              ? "bg-celo-forest text-white"
                              : "bg-white text-black hover:bg-celo-dk-tan"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 border border-black flex items-center justify-center transition-all ${
                              isSelected ? "bg-black" : "bg-white"
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
                  {Number(task.baseReward) / Math.pow(10, 18)} cUSD
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
                <span>Submitting...</span>
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

      {/* AI Rating Modal */}
      {showAiRatingModal && aiRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-celo-purple text-white text-center py-6 px-4">
              <div className="w-16 h-16 bg-white/20 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-gt-alpina font-bold tracking-wide">
                AI ANALYSIS COMPLETE
              </h3>
              <p className="text-white/90 text-sm mt-1 font-inter">
                Processing your reward...
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Rating Display */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-20 h-20 mx-auto border-4 border-black bg-celo-yellow flex items-center justify-center mb-3 shadow-[5px_5px_0_0_rgba(0,0,0,1)] rounded-full"
                >
                  <span className="text-2xl font-gt-alpina font-bold text-black">
                    {aiRating.rating}/10
                  </span>
                </motion.div>
                <p className="text-gray-700 text-sm">{aiRating.explanation}</p>
              </div>

              {/* Payment Summary */}
              <div className="bg-celo-lt-tan border-4 border-black rounded-xl p-4 space-y-2 font-inter">
                <div className="flex justify-between">
                  <span className="font-bold text-black">Base Reward</span>
                  <span>
                    {Number(paymentDetails?.baseReward).toFixed(3)} cUSD
                  </span>
                </div>
                <div className="flex justify-between text-celo-purple">
                  <span className="font-bold">
                    Bonus ({aiRating.rating}/10)
                  </span>
                  <span>
                    +
                    {(
                      (aiRating.rating *
                        Number(paymentDetails?.bonusReward || 0)) /
                      10
                    ).toFixed(3)}{" "}
                    cUSD
                  </span>
                </div>
                <div className="border-t-2 border-black pt-2 flex justify-between text-celo-success">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">
                    {paymentDetails?.totalReward.toFixed(3)} cUSD
                  </span>
                </div>
              </div>

              {/* Processing */}
              <div className="text-center pt-2">
                <div className="flex justify-center items-center gap-2 text-celo-purple font-bold">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing payment...</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Please wait while we finalize your transaction
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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

            {/* Receipt */}
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
                      {paymentDetails.transactionHash?.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between border-b-2 border-black pb-2">
                    <span className="font-bold text-gray-700">Base Reward</span>
                    <span>{paymentDetails.baseReward.toFixed(3)} cUSD</span>
                  </div>
                  <div className="flex justify-between border-b-2 border-black pb-2 text-celo-purple">
                    <span className="font-bold">Quality Bonus</span>
                    <span>+{paymentDetails.bonusReward.toFixed(3)} cUSD</span>
                  </div>
                  <div className="flex justify-between items-center bg-celo-forest text-white px-3 py-3 border-2 border-black">
                    <span className="font-gt-alpina text-lg font-bold">
                      Total Paid
                    </span>
                    <span className="text-xl font-gt-alpina font-bold">
                      {paymentDetails.totalReward.toFixed(3)} cUSD
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    window.open(
                      `https://celoscan.io/tx/${paymentDetails.transactionHash}`,
                      "_blank"
                    )
                  }
                  className="flex-1 bg-celo-blue text-white border-4 border-black rounded-xl py-3 font-semibold shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-celo-blue transition-all"
                >
                  View on Chain
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setResponses({});
                    setAiRating(null);
                    setPaymentDetails(null);
                    closeFormGenerator?.();
                    router.push("/Start");
                  }}
                  className="flex-1 bg-celo-success text-white border-4 border-black rounded-xl py-3 font-semibold shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-celo-success transition-all"
                >
                  Complete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
