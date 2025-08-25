"use client";

import React, { useState, useEffect } from 'react';
import { MockTask, MockSubtask } from "@/lib/mockData";
import { getAiRating } from "@/lib/AiRating";
import { 
  FileText, CheckCircle, Target, Star, Users, 
  Upload, AlertCircle, CheckCircle2, Loader2,
  Send, Save, Eye, EyeOff, Zap, Trophy, Clock
} from 'lucide-react';

interface FormGeneratorProps {
    task: MockTask;
  onComplete?: (results: TaskSubmission) => void;
}

interface TaskSubmission {
  taskId: string;
  subtaskResponses: SubtaskResponse[];
  totalScore: number;
  feedback: string;
  submittedAt: string;
}

interface SubtaskResponse {
  subtaskId: string;
  response: string | string[] | File | number;
  completed: boolean;
}

export default function FormGenerator({ task, onComplete }: FormGeneratorProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [feedbackLength, setFeedbackLength] = useState(0);
  const MAX_FEEDBACK_LENGTH = 500;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiRating, setAiRating] = useState<{ rating: number; explanation: string } | null>(null);
  const [showAiRating, setShowAiRating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [submissionResults, setSubmissionResults] = useState<TaskSubmission | null>(null);
  const [showResults, setShowResults] = useState(false);

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

  const handleInputChange = (subtaskId: string, value: any) => {
    setResponses(prev => ({ ...prev, [subtaskId]: value }));
    // Mark task as completed when user provides input
    setCompletedTasks(prev => new Set([...prev, subtaskId]));
    // Clear error when user starts typing
    if (errors[subtaskId]) {
      setErrors(prev => ({ ...prev, [subtaskId]: '' }));
    }
  };

  const handleFileUpload = (subtaskId: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [subtaskId]: file }));
    if (file) {
      setCompletedTasks(prev => new Set([...prev, subtaskId]));
    }
    if (errors[subtaskId]) {
      setErrors(prev => ({ ...prev, [subtaskId]: '' }));
    }
  };

  const handleRatingChange = (subtaskId: string, rating: number) => {
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

  const calculateScore = (): number => {
    let totalScore = 0;
    let maxScore = 0;
    
    task.subtasks.forEach(subtask => {
      maxScore += 10; // Each subtask worth 10 points
      
      if (subtask.required) {
        const response = responses[subtask.id];
        if (response && response !== '' && response !== null) {
          totalScore += 10;
        }
      }
    });
    
    return Math.round((totalScore / maxScore) * 10);
  };

  const handleSubmit = async () => {
    if (!validateResponses()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get AI rating for feedback if provided
      if (feedback.trim()) {
        const rating = await getAiRating('user-' + Date.now(), feedback, task.bestResponse);
        setAiRating(rating);
        setShowAiRating(true);
      }

      // Prepare submission data
      const submission: TaskSubmission = {
        taskId: task.id,
        subtaskResponses: task.subtasks.map(subtask => ({
          subtaskId: subtask.id,
          response: responses[subtask.id],
          completed: true
        })),
        totalScore: calculateScore(),
        feedback: feedback.trim(),
        submittedAt: new Date().toISOString()
      };

      // Store submission results
      setSubmissionResults(submission);
      setShowResults(true);

      // Call completion callback
      if (onComplete) {
        onComplete(submission);
      }

      // Auto-hide AI rating after 8 seconds
      setTimeout(() => {
        setShowAiRating(false);
        setAiRating(null);
      }, 8000);

    } catch (error) {
      console.error('Error submitting task:', error);
      setErrors({ general: 'Failed to submit task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSubtaskForm = (subtask: MockSubtask) => {
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
              maxLength={subtask.maxLength}
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
              {subtask.options?.map((option, index) => {
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
              })}
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
                accept={subtask.fileTypes?.map(type => `.${type}`).join(',')}
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
              {subtask.fileTypes && (
                <p className="text-xs text-gray-500 mt-2">
                  Formats: {subtask.fileTypes.join(', ')}
                </p>
              )}
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

//   const getSubtaskIcon = (type: string) => {
//     switch (type) {
//       case 'TEXT_INPUT': return <FileText className="w-5 h-5 text-blue-500" />;
//       case 'MULTIPLE_CHOICE': return <CheckCircle className="w-5 h-5 text-green-500" />;
//       case 'FILE_UPLOAD': return <Upload className="w-5 h-5 text-purple-500" />;
//       case 'RATING': return <Star className="w-5 h-5 text-yellow-500" />;
//       case 'SURVEY': return <Users className="w-5 h-5 text-indigo-500" />;
//       default: return <Target className="w-5 h-5 text-gray-500" />;
//     }
//   };

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
                <div className="text-lg font-bold text-green-700">{task.reward}</div>
                <div className="text-xs text-green-600">Reward</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <Zap className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <div className={`text-sm font-semibold px-2 py-1 rounded-full ${getDifficultyColor(task.difficulty)}`}>
                  {task.difficulty}
                </div>
                <div className="text-xs text-gray-600 mt-1">Difficulty</div>
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
                          {/* {getSubtaskIcon(subtask.type)} */}
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

        {/* Feedback Section */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900 flex items-center text-base">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                Task Feedback &amp; Review
                <span className="text-xs text-gray-500 ml-2 font-normal">(Optional but recommended)</span>
              </h3>
            
            {/* Feedback Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">💡 Tips for better feedback:</p>
                  <ul className="text-xs space-y-1 text-blue-700">
                    <li>• Be specific about what worked well and what didn&apos;t</li>
                    <li>• Share your experience with each subtask</li>
                    <li>• Suggest improvements for future users</li>
                    <li>• Rate the overall task difficulty and clarity</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <textarea
              value={feedback}
              onChange={(e) => handleFeedbackChange(e.target.value)}
              placeholder={`Share your detailed thoughts about this task...

Examples:
• How clear were the instructions?
• Which subtasks were most or least helpful?
• What would you change or improve?
• Overall experience and satisfaction level`}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Your feedback will be reviewed by AI for quality assessment</span>
              <span className={`${feedbackLength > MAX_FEEDBACK_LENGTH * 0.9 ? 'text-orange-600' : 'text-gray-500'}`}>
                {feedbackLength}/{MAX_FEEDBACK_LENGTH} characters
              </span>
            </div>
          </div>
        </div>

        {/* AI Rating Display */}
        {showAiRating && aiRating && (
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
    </div>
  );
}