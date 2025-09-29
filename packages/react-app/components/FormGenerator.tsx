"use client";

import React, { useState, useEffect } from 'react';
import { TaskWithEligibility } from "@/lib/taskService";
import { getAiRating } from "@/lib/AiRating";
import { 
  FileText, CheckCircle, Target, Star, Users, 
  Upload, AlertCircle, CheckCircle2, Loader2,
  Send, Save, Eye, EyeOff, Zap, Trophy, Clock,
  X, Sparkles, Coins, Gift,
  Receipt,
  User,
  Hash,
  SquareArrowOutUpRight
} from 'lucide-react';
import { makePaymentToUser } from '@/lib/WriteFunctions';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import { createTaskSubmissionWithResponses } from '@/lib/Prismafnctns';
import { sendWhatsappResponse } from '@/lib/Whatsapp';
import { sendEmailResponse } from '@/lib/Email';

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

export default function FormGenerator({ task, onTaskCompleted , closeFormGenerator }: FormGeneratorProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const { address } = useAccount();
  const [feedback, setFeedback] = useState('');
  const [feedbackLength, setFeedbackLength] = useState(0);
  const MAX_FEEDBACK_LENGTH = 500;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiRating, setAiRating] = useState<{ rating: number; explanation: string } | null>(null);
  const [showAiRatingModal, setShowAiRatingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [submissionResults, setSubmissionResults] = useState<TaskSubmission | null>(null);
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


  // Initialize responses for all subtasks
  useEffect(() => {
    const initialResponses: Record<string, any> = {};
    task.subtasks.forEach(subtask => {
      if (subtask.type === 'MULTIPLE_CHOICE') {
        initialResponses[subtask.id] = [];
      } else if (subtask.type === 'RATING') {
        initialResponses[subtask.id] = 5; // Default to middle rating
      } else {
        initialResponses[subtask.id] = '';
      }
    });
    setResponses(initialResponses);
  }, [task]);

  const handleInputChange = (subtaskId: number, value: any) => {
    setResponses(prev => ({ ...prev, [subtaskId]: value }));
    // Mark task as completed when user provides input
    setCompletedTasks(prev => new Set([...prev, subtaskId]));
    // Clear error when user starts typing
    if (errors[subtaskId]) {
      setErrors(prev => ({ ...prev, [subtaskId]: '' }));
    }
  };

  const handleFileUpload = (subtaskId: number, file: File | null) => {
    setFiles(prev => ({ ...prev, [subtaskId]: file }));
    if (file) {
      setCompletedTasks(prev => new Set([...prev, subtaskId]));
    }
    if (errors[subtaskId]) {
      setErrors(prev => ({ ...prev, [subtaskId]: '' }));
    }
  };

  const handleRatingChange = (subtaskId: number, rating: number) => {
    setRatings(prev => ({ ...prev, [subtaskId]: rating }));
    setResponses(prev => ({ ...prev, [subtaskId]: rating }));
    setCompletedTasks(prev => new Set([...prev, subtaskId]));
  };

  const handleFeedbackChange = (value: string) => {
    if (value.length <= MAX_FEEDBACK_LENGTH) {
      setFeedback(value);
      setFeedbackLength(value.length);
    }
  };

  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    task.subtasks.forEach(subtask => {
      if (subtask.required) {
        const response = responses[subtask.id];
        
        if (subtask.type === 'FILE_UPLOAD') {
          if (!files[subtask.id]) {
            newErrors[subtask.id] = 'Please upload a file';
          }
        } else if (subtask.type === 'MULTIPLE_CHOICE') {
          if (!response || response.length === 0) {
            newErrors[subtask.id] = 'Please select at least one option';
          }
        } else if (subtask.type === 'TEXT_INPUT') {
          if (!response || response.trim() === '') {
            newErrors[subtask.id] = 'This field is required';
          } else if (subtask.maxLength && response.length > subtask.maxLength) {
            newErrors[subtask.id] = `Maximum ${subtask.maxLength} characters allowed`;
          }
        } else if (subtask.type === 'RATING') {
          if (!response || response < 1 || response > 10) {
            newErrors[subtask.id] = 'Please provide a rating';
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

    setIsSubmitting(true);
    
    try {
      const textFeedback = task.subtasks
        .filter(subtask => subtask.type === 'TEXT_INPUT' && responses[subtask.id])
        .map(subtask => responses[subtask.id])
        .join('\n');
     
      console.log(textFeedback);
      
      // Get AI rating for feedback
      const feedbackText = textFeedback.trim() || "No feedback provided";
      const rating = await getAiRating('user-' + Date.now(), feedbackText, task.aiCriteria);
      
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
        explanation: rating?.explanation || 'No explanation provided'
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
        toast.error('Payment failed');
        setIsSubmitting(false);
        return;
      }

      // Update payment details with transaction hash
      const updatedPaymentDetails = {
        ...newPaymentDetails,
        transactionHash: paymentHash
      };
      setPaymentDetails(updatedPaymentDetails);

      // Close AI rating modal and show payment modal
      setShowAiRatingModal(false);
      setShowPaymentModal(true);

      // Prepare submission data for database
      const subtaskResponses = task.subtasks.map(subtask => ({
        subtaskId: subtask.id,
        response: JSON.stringify(responses[subtask.id]),
        fileUrl: files[subtask.id] ? files[subtask.id]?.name : undefined
      }));

      // Save submission to database
      const dbSubmission = await createTaskSubmissionWithResponses(
        task.id,
        address as string,
        subtaskResponses,
        rating?.rating || 1,
        rating?.explanation || 'No explanation provided',
        totalReward.toString()
      );

      if (!dbSubmission) {
        throw new Error('Failed to save submission to database');
      }

      // Send notification to creator based on contact method
      const taskBalance = "0.00"; // Placeholder - implement based on your needs
      const notificationData = {
        taskTitle: task.title,
        participant: address?.slice(0, 6) + '...' + address?.slice(-4) || 'Unknown',
        response: textFeedback,
        aiRating: (rating?.rating || 1).toString(),
        Reward: totalReward.toFixed(3),
        TaskBalance: taskBalance
      };

      if (task.contactMethod === 'WHATSAPP' && task.contactInfo) {
        try {
          await sendWhatsappResponse({
            ...notificationData,
            creatorPhoneNo: task.contactInfo
          });
          
          console.log('WhatsApp notification sent to creator');
        } catch (whatsappError) {
          console.error('Failed to send WhatsApp notification:', whatsappError);
          // toast.error('Task submitted but failed to notify creator via WhatsApp');
        }
      } else if (task.contactMethod === 'EMAIL' && task.contactInfo) {
        try {
          await sendEmailResponse({
            ...notificationData,
            creatorEmail: task.contactInfo
          });
          
          console.log('Email notification sent to creator');
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          toast.error('Task submitted but failed to notify creator via email');
        }
      }

      // Prepare submission data for UI
      const submission: TaskSubmission = {
        taskId: task.id,
        subtaskResponses: task.subtasks.map(subtask => ({
          subtaskId: subtask.id,
          response: responses[subtask.id],
          completed: true
        })),
        totalScore: rating?.rating || 1,
        feedback: feedbackText,
        submittedAt: new Date().toISOString()
      };

      // Store submission results
      setSubmissionResults(submission);

      // Notify parent component that task was completed
      if (onTaskCompleted) {
        onTaskCompleted();
      }

    } catch (error) {
      console.error('Error submitting task:', error);
      setErrors({ general: 'Failed to submit task. Please try again.' });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSubtaskForm = (subtask: TaskWithEligibility['subtasks'][0]) => {
    const hasError = errors[subtask.id];
    const isRequired = subtask.required;
    const isCompleted = completedTasks.has(subtask.id);

    switch (subtask.type) {
      case 'TEXT_INPUT':
        return (
          <div className="space-y-3">
            <textarea
              value={responses[subtask.id] || ''}
              onChange={(e) => handleInputChange(subtask.id, e.target.value)}
              placeholder={subtask.placeholder || 'Enter your response...'}
              maxLength={subtask.maxLength || undefined}
              rows={3}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm ${
                hasError ? 'border-red-300 bg-red-50' : isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            />
            {subtask.maxLength && (
              <div className="flex justify-between items-center text-xs">
                <div className={`${responses[subtask.id]?.length > (subtask.maxLength * 0.9) ? 'text-orange-600' : 'text-gray-400'}`}>
                  {responses[subtask.id]?.length || 0}/{subtask.maxLength} characters
                </div>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              </div>
            )}
            {hasError && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{hasError}</span>
              </div>
            )}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              {subtask.options ? JSON.parse(subtask.options).map((option: string, index: number) => {
                const isSelected = responses[subtask.id]?.includes(option) || false;
                return (
                  <label key={index} className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const current = responses[subtask.id] || [];
                        if (e.target.checked) {
                          handleInputChange(subtask.id, [...current, option]);
                        } else {
                          handleInputChange(subtask.id, current.filter((item: string) => item !== option));
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="text-sm text-gray-700 flex-1">{option}</span>
                  </label>
                );
              }) : null}
            </div>
            {hasError && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{hasError}</span>
              </div>
            )}
          </div>
        );

      case 'FILE_UPLOAD':
        return (
          <div className="space-y-3">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              files[subtask.id] ? 'border-green-400 bg-green-50' : hasError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
            }`}>
              <div className="space-y-2">
                {files[subtask.id] ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                    <p className="text-sm font-medium text-green-700">{files[subtask.id]?.name}</p>
                    <p className="text-xs text-green-600">File uploaded successfully!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Tap to upload</span> or drag file here
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="*/*"
                onChange={(e) => handleFileUpload(subtask.id, e.target.files?.[0] || null)}
                className="hidden"
                id={`file-${subtask.id}`}
              />
              <label
                htmlFor={`file-${subtask.id}`}
                className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
              >
                {files[subtask.id] ? 'Change File' : 'Choose File'}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                All file types accepted
              </p>
            </div>
            {hasError && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{hasError}</span>
              </div>
            )}
          </div>
        );

      case 'RATING':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingChange(subtask.id, rating)}
                  className={`h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all active:scale-95 ${
                    responses[subtask.id] === rating
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {responses[subtask.id] ? (
                  <span className="font-medium text-blue-600">Rating: {responses[subtask.id]}/10</span>
                ) : (
                  'Tap a number to rate'
                )}
              </div>
            </div>
            {hasError && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{hasError}</span>
              </div>
            )}
          </div>
        );

      case 'SURVEY':
        return (
          <div className="space-y-3">
            <textarea
              value={responses[subtask.id] || ''}
              onChange={(e) => handleInputChange(subtask.id, e.target.value)}
              placeholder="Share your detailed thoughts..."
              rows={4}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm ${
                hasError ? 'border-red-300 bg-red-50' : isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            />
            {isCompleted && (
              <div className="flex items-center justify-end">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            )}
            {hasError && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{hasError}</span>
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
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const completionProgress = (completedTasks.size / task.subtasks.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 py-6 space-y-4">
        {/* Task Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{task.title}</h1>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{task.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-100">
                <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-700">
                  {Number(task.baseReward) / Math.pow(10, 18)} cUSD
                </div>
                <div className="text-xs text-green-600">Reward</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-900">
                  {completedTasks.size}/{task.subtasks.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subtasks Forms */}
        <div className="space-y-2">
          {task.subtasks.map((subtask, index) => {
            const isCompleted = completedTasks.has(subtask.id);
            return (
              <div key={subtask.id} className={`bg-white rounded-2xl shadow-lg border transition-all ${
                isCompleted ? 'border-green-200 shadow-green-100' : 'border-gray-100'
              }`}>
                <div className="p-5 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 text-base leading-tight">{subtask.title}</h3>
                        </div>
                        {subtask.required && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{subtask.description}</p>
                    </div>
                  </div>
                  
                  {renderSubtaskForm(subtask)}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Rating Display */}
        {showAiRatingModal && aiRating && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-5 border border-green-200">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">AI Feedback Rating</h3>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-green-600">{aiRating.rating}/10</div>
                <div className="flex-1">
                  <p className="text-green-700 font-medium text-sm">AI Assessment</p>
                  <p className="text-green-600 text-sm leading-relaxed">{aiRating.explanation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submission Results */}
        {showResults && submissionResults && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-5 border border-blue-200">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-blue-800 text-lg">Task Submitted Successfully! 🎉</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-3 border border-blue-200">
                  <div className="text-center">
                    <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-lg font-bold text-blue-700">{submissionResults.totalScore}/10</div>
                    <div className="text-xs text-blue-600">Completion Score</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-blue-200">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-bold text-blue-700">
                      {new Date(submissionResults.submittedAt).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-blue-600">Submitted At</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-blue-200">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">📊 Task Summary:</p>
                  <ul className="text-xs space-y-1 text-blue-700">
                    <li>• Completed {task.subtasks.length} subtasks</li>
                    <li>• {submissionResults.feedback ? 'Provided detailed feedback' : 'No additional feedback'}</li>
                    <li>• {aiRating ? `AI rated feedback: ${aiRating.rating}/10` : 'Feedback pending review'}</li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setShowResults(false);
                    setSubmissionResults(null);
                    // Reset form for new submission if needed
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pb-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting Task...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Task</span>
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {submissionResults && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Task submitted successfully! Check your wallet for the reward.</span>
            </div>
          </div>
        )}

        {/* General Error Display */}
        {errors.general && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{errors.general}</span>
            </div>
          </div>
        )}
      </div>

        {/* AI Rating Modal */}
      {showAiRatingModal && aiRating && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-80 max-w-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white text-center rounded-t-2xl">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-1">AI Analysis Complete</h3>
              <p className="text-indigo-100 text-sm">Processing your reward...</p>
            </div>

            <div className="p-4 space-y-4">
              {/* AI Rating Display */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-2xl font-bold text-white">{aiRating.rating}/10</span>
                </div>
                <p className="text-gray-600 text-sm">{aiRating.explanation}</p>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Reward</span>
                  <span className="font-medium">{Number(paymentDetails?.baseReward).toFixed(3)} cUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">Bonus ({aiRating.rating}/10)</span>
                  <span className="font-medium text-purple-600">+{Number(paymentDetails?.baseReward || 0 + (aiRating.rating * Number(paymentDetails?.bonusReward))/10).toFixed(3)} cUSD</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-green-600">{paymentDetails?.totalReward.toFixed(3)} cUSD</span>
                </div>
              </div>

              {/* Processing Payment */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Processing Payment...</span>
                </div>
                <p className="text-gray-500 text-xs">Please wait while we process your reward</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Success Modal */}
      {showPaymentModal && paymentDetails && paymentDetails.transactionHash && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Confetti width={1000} height={1000} recycle={false} /> 
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm">
            {/* Header */}
            <div className="bg-indigo-400  p-4 text-white text-center relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h3>
              <p className="text-green-100">Your reward has been processed</p>
            </div>

            {/* Transaction Receipt */}
            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-gray-600" />
                    Transaction Receipt
                  </h4>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    {new Date().toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Recipient
                    </span>
                    <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 flex items-center">
                      <Hash className="w-4 h-4 mr-2" />
                      Transaction Hash
                    </span>
                    <span className="font-mono text-xs bg-green-50 px-2 py-1 rounded">
                      {paymentDetails.transactionHash?.slice(0, 8)}...
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Base Reward</span>
                    <span className="font-semibold">{paymentDetails.baseReward.toFixed(3)} cUSD</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-purple-600">Quality Bonus</span>
                    <span className="font-semibold text-purple-700">+{paymentDetails.bonusReward.toFixed(3)} cUSD</span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3 border border-green-200">
                    <span className="text-lg font-bold text-green-800">Total Paid</span>
                    <span className="text-xl font-bold text-green-600">{paymentDetails.totalReward.toFixed(3)} cUSD</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Open block explorer with transaction hash
                    window.open(`https://celoscan.io/tx/${paymentDetails.transactionHash}`, '_blank');
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors"
                >
                  <SquareArrowOutUpRight className="w-4 h-4" />
                  <span>View on Chain</span>
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    // Reset form state
                    setResponses({});
                    setCompletedTasks(new Set());
                    setAiRating(null);
                    setPaymentDetails(null);
                    closeFormGenerator?.();
                    
                  }}
                  className="flex-1 px-4 py-3 bg-indigo-400 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}