'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bug, MessageSquareText, Send, CheckCircle2, Sparkles, Stars, Gift, X } from 'lucide-react';
import { getAiRating } from '@/lib/AiRating';
import AIResults from '../AIResults';
import { baseReward } from '@/contexts/Terms';
import { addRewardsToUser } from '@/contexts/Terms';
import { useAccount, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { contractAbi, contractAddress } from '@/contexts/constants';
import Congrats from '../Congrats';
import { useUserSmartAccount } from '@/app/hooks/useUserSmartAccount';
import { recordTask, getTaskOutput, getUser } from '@/lib/Prismafnctns';


export interface FeedbackRating {
  rating: number;
  explanation: string;
}

const Task5Form = ({id, searchParams}: {id: string, searchParams?: {completed?: string}}) => {
  const [feedback, setFeedback] = useState('');
  const [bugReport, setBugReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiRating, setAiRating] = useState<FeedbackRating | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isTester, setIsTester] = useState(false);


  useEffect(()=>{

    const fetchUser = async() =>{
      if(!address) return;
      const user = await getUser(address as string);
      if(!user) return;
      setIsTester(user.isTester)
    }
    fetchUser();
  },[address])

    const handleGoBack = async (amount: string) => {
      await addTaskToDb(false, amount)
      window.history.back();
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if(!isTester ){
      toast("only the selected testers can participate.");
      return;
    }
    
    try {
      const message = feedback + `\n\nBug Report: ${bugReport}`;
       // get user
       const user = await getUser(address as string);
       if(!user) return;
       const res = await fetch('/api/rate-feedback', {
         method: 'POST',
         body: JSON.stringify({
           userId: (user.id).toString(),
           feedback: message,
         }),
       });    
       const data = await res.json();
       setAiRating(data);
      
      // Show the rating animation
      setShowRating(true);
      
      // After showing rating, show reward modal
      setTimeout(() => {
        setShowRating(false);
        setShowRewardModal(true);
      }, 3000);
      
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }finally{
      setIsSubmitting(false);
    }
  };


  const handleCloseRewardModal = () => {
    setShowRewardModal(false);
    setIsSubmitted(true);
  };

    // function to record the task
    const addTaskToDb = async(claimed:boolean, amount:string) => {
      try {
        if(!address){
          toast("please connect wallet.");
          return;
        }
        const message = bugReport !== '' ? feedback + `\n\nBug Report: ${bugReport}` : feedback;
        const aiRatingJson = JSON.stringify(aiRating);
        const individualFeedback = JSON.stringify(message);
        await recordTask(Number(id),claimed,amount,aiRatingJson,individualFeedback,address);
        
      } catch (error) {
        console.log("error", error);
        toast('something happened.try again.');  
      }
    }
  

  const afterSuccess = () => {
    setShowRewardModal(false);
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <Congrats />
    );
  }


  if (showRewardModal && aiRating) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-gray-100 flex items-center justify-center p-4">
       <AIResults 
        aiRating={aiRating} 
        loading={isClaiming} 
        changeLoading={setIsClaiming} 
        afterSuccess={afterSuccess} 
        onClose={handleGoBack} 
        handlePrismaRecord={addTaskToDb}
      />
    </div>
    );
  }

  if (showRating && aiRating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg text-center border border-gray-100">
          <div className="animate-pulse mb-6">
            <Sparkles className="w-12 h-12 mx-auto text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analyzing Your Feedback</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Clarity</span>
              <RatingBar value={aiRating.rating / 10} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Usefulness</span>
              <RatingBar value={(aiRating.rating + 2) / 12} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Detail</span>
              <RatingBar value={(aiRating.rating + 1) / 11} />
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Stars className="text-yellow-500" />
              <span className="font-bold text-indigo-700">
                Preliminary Rating: {aiRating.rating}/10
              </span>
            </div>
            <p className="text-sm text-gray-700">
              {aiRating.explanation}
            </p>
          </div>

          <div className="animate-pulse text-sm text-gray-500">
            Calculating your reward...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-indigo-700">Feedback & Bug Report</h1>
            <p className="text-xs text-gray-500">Earn up to 3 cUSD for valuable feedback</p>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 p-2 rounded-full">
              <MessageSquareText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{baseReward} cUSD base reward</span> for submitting feedback.
                <span className="block mt-1 font-semibold text-emerald-600">+ up to 1 cUSD bonus</span> based on feedback quality (AI-rated).
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Feedback Field */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <MessageSquareText className="w-5 h-5 text-indigo-600" />
              </div>
              <label className="block text-sm font-medium text-gray-700">
                Your Feedback (Required)
              </label>
            </div>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 text-sm"
              placeholder="What did you like? What could be improved? Any suggestions?"
              required
            />
          </div>

          {/* Bug Report Field */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-rose-100 p-2 rounded-full">
                <Bug className="w-5 h-5 text-rose-600" />
              </div>
              <label className="block text-sm font-medium text-gray-700">
                Bug Report (Optional)
              </label>
            </div>
            <textarea
              rows={3}
              value={bugReport}
              onChange={(e) => setBugReport(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-500 text-sm"
              placeholder="Describe any bugs you encountered (steps to reproduce, screenshots if possible)..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Quality bug reports may increase your reward bonus
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-80' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Rating bar component for the analysis screen
const RatingBar = ({ value }: { value: number }) => (
  <div className="w-32 bg-gray-200 rounded-full h-2.5">
    <div 
      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2.5 rounded-full" 
      style={{ width: `${value * 100}%` }}
    ></div>
  </div>
);

export default Task5Form;