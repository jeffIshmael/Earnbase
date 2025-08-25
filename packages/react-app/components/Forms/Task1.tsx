'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, ChevronRight, Star, ThumbsUp, Meh, ThumbsDown, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { recordTask, getUser } from '@/lib/Prismafnctns'; 
import { toast } from 'sonner';

const Task1Form = ({id, searchParams}: {id: string, searchParams?: {completed?: string}}) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [understanding, setUnderstanding] = useState('');
  const router = useRouter();
  const {address} = useAccount();
  const [isCompleted, setIsCompleted] = useState(false);
  const [ isTester ,setIsTester ] = useState(false);
  
  // Get the completed status either from props or URL
  useEffect(() => {
    if (searchParams?.completed) {
      setIsCompleted(searchParams.completed === 'true');
      return;
    }
    
    // Fallback to URL search params
    const params = new URLSearchParams(window.location.search);
    setIsCompleted(params.get('completed') === 'true');
  }, []);

  useEffect(()=>{

    const fetchUser = async() =>{
      if(!address) return;
      const user = await getUser(address as string);
      if(!user) return;
      // For now, set all users as testers since isTester property doesn't exist
      setIsTester(true)
    }
    fetchUser();
  },[address])

  // fu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompleted) return;
    if(!isTester ){
      toast("only the selected testers can participate.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const individualFeedback = JSON.stringify({
        feedback: feedback,
        rating: rating,
        understanding: understanding,
      });
      await recordTask(Number(id), true, "0", null, individualFeedback, address as string);
      setSubmitted(true);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }   
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg text-center border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We appreciate your time!
          </p>
          <button
            onClick={handleGoBack}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            Complete Another Task <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 p-4">
      <div className={`max-w-2xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden border ${
        isCompleted ? 'border-emerald-200' : 'border-gray-100'
      }`}>
        {/* Header with back button */}
        <div className={`p-6 text-white relative ${
          isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        }`}>
          <button 
            onClick={handleGoBack}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-8">
            <h1 className="text-2xl font-bold">Task 1: Getting Started</h1>
            <p className={isCompleted ? 'text-emerald-100' : 'text-indigo-100'}>
              {isCompleted ? 'You completed this task!' : 'Welcome to ChamaPay! Complete this task to earn your first reward.'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Instructions</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-emerald-100' : 'bg-emerald-100'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isCompleted ? 'text-emerald-600' : 'text-emerald-600'
                      }`}>{step}</span>
                    </div>
                  </div>
                  <p className={`${
                    isCompleted ? 'text-gray-500' : 'text-gray-700'
                  }`}>
                    {step === 1 && 'Confirm you have received 0.5 CELO for gas fees.'}
                    {step === 2 && 'Explore the ChamaPay miniapp (no action needed — just look around).'}
                    {step === 3 && 'Return and fill the form below to complete the task.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isCompleted ? 'text-gray-500' : 'text-gray-700'
                }`}>
                  How would you rate the onboarding experience?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'Excellent', icon: <Star className="w-5 h-5" />, label: 'Excellent' },
                    { value: 'Good', icon: <ThumbsUp className="w-5 h-5" />, label: 'Good' },
                    { value: 'Average', icon: <Meh className="w-5 h-5" />, label: 'Average' },
                    { value: 'Poor', icon: <ThumbsDown className="w-5 h-5" />, label: 'Poor' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isCompleted}
                      onClick={() => !isCompleted && setRating(option.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                        rating === option.value
                          ? isCompleted 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : isCompleted
                            ? 'border-gray-200 bg-gray-50 text-gray-400'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="mb-1">{option.icon}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
                <input type="hidden" required value={rating} />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isCompleted ? 'text-gray-500' : 'text-gray-700'
                }`}>
                  Do you understand what ChamaPay is and how it works?
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="understanding"
                      value="yes"
                      checked={understanding === 'yes'}
                      onChange={() => !isCompleted && setUnderstanding('yes')}
                      required={!isCompleted}
                      disabled={isCompleted}
                      className={`h-4 w-4 ${
                        isCompleted ? 'text-gray-400' : 'text-indigo-600'
                      } focus:ring-indigo-500 border-gray-300`}
                    />
                    <span className={`text-sm ${
                      isCompleted ? 'text-gray-500' : 'text-gray-700'
                    }`}>Yes, completely</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="understanding"
                      value="no"
                      checked={understanding === 'no'}
                      onChange={() => !isCompleted && setUnderstanding('no')}
                      required={!isCompleted}
                      disabled={isCompleted}
                      className={`h-4 w-4 ${
                        isCompleted ? 'text-gray-400' : 'text-indigo-600'
                      } focus:ring-indigo-500 border-gray-300`}
                    />
                    <span className={`text-sm ${
                      isCompleted ? 'text-gray-500' : 'text-gray-700'
                    }`}>Somewhat unclear</span>
                  </label>
                </div>
              </div>

              {understanding === 'no' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isCompleted ? 'text-gray-500' : 'text-gray-700'
                  }`}>
                    What was unclear to you?
                    <span className="text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => !isCompleted && setFeedback(e.target.value)}
                    placeholder="Feel free to mention anything confusing..."
                    rows={4}
                    disabled={isCompleted}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none ${
                      isCompleted
                        ? 'border-gray-200 bg-gray-50 text-gray-400'
                        : 'border-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCompleted || isSubmitting}
                  className={`w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md transition ${
                    isCompleted
                      ? 'bg-emerald-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isCompleted ? (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Task Completed
                    </span>
                  ) : isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Submit Feedback
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Task1Form;