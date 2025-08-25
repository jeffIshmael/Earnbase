'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, CircleDollarSign, Bell, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { recordTask, getUser, getUserFeedback } from '@/lib/Prismafnctns';

const Task3Form = ({id, searchParams}: {id: string, searchParams?: {completed?: string}}) => {
  // const [play] = useSound('/sounds/success-notification.mp3'); // Add this sound file to your public/sounds folder
  const [isLoading, setIsLoading] = useState(false);
  const {address} = useAccount();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTester,setIsTester ] = useState(false);


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

    useEffect(()=>{
      const fetchUserFeedback = async() =>{
        if(!address) return;
        if(isCompleted){
          const task3Feedback = await getUserFeedback(address as string,3);
        }
      }
      fetchUserFeedback();
    },[address, isCompleted])
  const handleGoBack = () => {
    window.history.back();
  };

  const handleStartChallenge = async () => {
    try {
      setIsLoading(true);
      if(!address){
        toast("please connect wallet.");
        return;
      }

      if(!isTester ){
        toast("only the selected testers can participate.");
        return;
      }

      await recordTask(Number(id),true,"0",null,'',address as string);
    
      // Simulate API call or processing
      setTimeout(() => {
        // Play success sound
        // play();
        
        toast(
          <div className="flex items-start gap-3">
            <CheckCircle2 className="flex-shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Challenge Started!</h4>
              <p className="text-sm text-gray-600">
                Daily rewards activated. See you on payout day!
              </p>
            </div>
          </div>,
          {
            position: 'top-center',
            duration: 3000,
            className: 'border border-emerald-200 bg-gradient-to-br from-white to-emerald-50',
            style: {
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
            },
          }
        );
        
        setIsLoading(false);
        setIsCompleted(true);
      }, 1500); // 1.5 second delay to simulate processing
    } catch (error) {
      console.error(error);            
    }finally{
      setIsLoading(false);
    }
   
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header with celebration gradient */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/30"></div>
              <div className="absolute bottom-2 left-6 w-24 h-24 rounded-full bg-white/20"></div>
            </div>
            <div className="relative z-10 text-center">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Challenge Activated!</h1>
              <p className="text-emerald-100">Your daily rewards are now active</p>
            </div>
          </div>
  
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Progress Summary */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <CalendarDays className="text-indigo-600" />
                Your Commitment Period
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Start Date</span>
                  <span className="font-medium">July 14, 2025</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">End Date</span>
                  <span className="font-medium">July 28, 2025</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Remaining</span>
                  <span className="font-medium text-emerald-600">14 days</span>
                </div>
              </div>
            </div>
  
            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
              <h2 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
                <Bell className="text-blue-500" />
                What to Remember
              </h2>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">1</span>
                  <span>You will recieve 1.2 cUSD daily, make sure you make 1 cUSD payment to the chama.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">2</span>
                  <span>Automatic payouts; happen daily depending on if all the members have made payment.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">3</span>
                  <span>Do this till July 28.</span>
                </li>
              </ul>
            </div>
  
            {/* Action Button */}
            <button
              onClick={handleGoBack}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Header with back button */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button 
            onClick={handleGoBack}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-8">
            <h1 className="text-2xl font-bold">Daily Commitment</h1>
            <p className="text-indigo-100 mt-1 text-sm">
              Complete your daily routine to earn rewards
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="flex-shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-emerald-800">Task 1 & 2 Completed!</h3>
              <p className="text-sm text-emerald-700 mt-1">
                You&apos;re now ready for the daily commitment challenge.
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Your 2-Week Routine
            </h2>
            
            <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <CircleDollarSign className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-indigo-800">Daily Earnings</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    You&apos;ll receive <span className="font-semibold">1.2 cUSD</span> daily to your wallet
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-indigo-800">Daily Payment</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Make a payment of <span className="font-semibold">1 cUSD</span> to your Chama group each day
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Bell className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-indigo-800">Reminders</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    We&apos;ll send you daily reminders via Farcaster
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-amber-800">Important Note</h3>
                <p className="text-sm text-amber-700 mt-1">
                  You don&apos;t need to return to this platform - just complete your daily payments as instructed in the reminders.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleStartChallenge}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting...
              </>
            ) : (
              'I Understand - Start Challenge'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Task3Form;