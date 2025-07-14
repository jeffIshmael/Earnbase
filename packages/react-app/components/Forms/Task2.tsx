'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Star,AlertCircle, CheckCircle2, Sparkles, Stars, Gift, X } from 'lucide-react';
import { FeedbackRating } from './Task5';
import AIResults from '../AIResults';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useUserSmartAccount } from '@/app/hooks/useUserSmartAccount';
import { toast } from 'sonner';
import { recordTask, getTaskOutput, getUser } from '@/lib/Prismafnctns';
import Image from 'next/image';



const Task2Form = ({id, searchParams}: {id: string, searchParams?: {completed?: string}}) => {
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [extraNotes, setExtraNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugReport, setBugReport] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiRating, setAiRating] = useState<FeedbackRating | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [imageIpfs, setImageIpfs] = useState('');
  const router = useRouter();
  const {address} = useAccount();
  const [isCompleted, setIsCompleted] = useState(false);
  const { smartAccount ,smartAccountClient } = useUserSmartAccount();
  const [isTester,  setIsTester  ]= useState(false);
  
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
      setIsTester(user.isTester)
    }
    fetchUser();
  },[address])
  
// Get the completed status either from props or URL
useEffect(() => {
  // check if is Completetd
  const checkIsComplete = async () =>{
    if(isCompleted)
    {await getPastResponse(address as string);}
  }
  checkIsComplete()
}, [address, isCompleted]);

  // function to upload image
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 try {
  const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
      // upload to pinata
      const data = new FormData();
      data.set("file", file);
      const uploadRequest = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const ipfsHash = await uploadRequest.json();
      console.log("ipfshash",ipfsHash);
      setImageIpfs(ipfsHash);
    }
 } catch (error) {
   console.log(error);
 }

    
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!screenshot || !feedback.trim() || !confirmed) {
      toast('Please provide a screenshot, feedback, and confirm the action.');
      return;
    }
    if(!isTester ){
      toast("only the selected testers can participate.");
      return;
    }
   
    try {
      setIsSubmitting(true);
      // get user
      const user = await getUser(address as string);
      if(!user) return;
      const message = bugReport !== '' ? feedback + `\n\nBug Report: ${bugReport}` : feedback;
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
    }finally{
      setIsSubmitting(false);
    }
  };

  // function to fetch past response
  const getPastResponse =  async ( address: string) =>{
    const task2Res = await getTaskOutput(address, Number(id));
    if(!task2Res) return;
    setImageIpfs(task2Res[0].ipfsHash?? "")
  }

  const afterSuccess = () => {
    setShowRewardModal(false);
    setSubmitted(true);
  }

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

  const handleGoBack = async (amount: string) => {
    await addTaskToDb(false, amount)
    window.history.back();
  };

  if (submitted || isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header with decorative elements */}
          <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/30"></div>
              <div className="absolute bottom-2 left-6 w-24 h-24 rounded-full bg-white/20"></div>
            </div>
            <div className="relative z-10 text-center">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Task Completed!</h1>
              <p className="text-emerald-100">You&apos;ve successfully joined your group</p>
            </div>
          </div>
  
          <div className="p-6 space-y-6">
            {/* Submission Summary Card */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 shadow-sm">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Your Submission Details
              </h2>
              
              {imageIpfs && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Screenshot</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Verified</span>
                  </div>
                  <div className="relative group">
                    <Image 
                      src={`https://ipfs.io/ipfs/${imageIpfs}`}
                      alt="Your submission" 
                      className="w-full rounded-lg border border-gray-300 shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-200"></div>
                  </div>
                </div>
              )}
  
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Your Feedback</h3>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-line">{feedback || "No feedback provided"}</p>
                  </div>
                </div>
  
                {bugReport && (
                  <div>
                    <h3 className="text-sm font-medium text-red-600 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Bug Report
                    </h3>
                    <div className="bg-white p-3 rounded border border-red-100">
                      <p className="text-gray-800 whitespace-pre-line">{bugReport}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
  
            {/* Next Steps */}
            <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-200">
              <h2 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                What&apos;s Next?
              </h2>
              <ul className="space-y-3">
                {[
                  "Proceed with other tasks.",
                  "Look forward to doing the daily activity.", 
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-1 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
  
            {/* Action Button */}
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showRewardModal && aiRating) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-gray to-indigo-100 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-gray to-indigo-100 flex items-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Header with back button */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white relative">
          <button 
            onClick={() => window.history.back()}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-8">
            <h1 className="text-xl font-bold">Task 2: Join Your Group</h1>
            <p className="text-indigo-100 text-sm mt-1">
              Complete the steps and submit your feedback
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
            <h2 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              Before you begin
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              Ensure your wallet has been credited with <span className="font-semibold">2.5 cUSD</span>
            </p>

            <h2 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
              Task Steps
            </h2>
            <ol className="list-decimal ml-6 text-sm text-gray-700 space-y-2">
              <li>Go to ChamaPay miniapp → Explore section</li>
              <li>Join your assigned group</li>
              <li>Make a payment of 1 cUSD</li>
              <li>Take a screenshot of the Chama details</li>
            </ol>
  <div className="mt-2 border rounded-lg overflow-hidden">
    <Image
      src={`https://ipfs.io/ipfs/bafkreifkhmm2ergyvxfbayjjdhybz35337ku2u5shgc66o47bcdfuyuwcu`} // Update this path
      alt="Example of Chama details page"
      width={600}
      height={400}
      className="w-full"
    />
    <div className="p-2 bg-gray-50 text-xs text-gray-500 text-center">
      This is how the Chama details page should look
    </div>

</div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Screenshot Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Screenshot
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Feedback
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                placeholder="Describe your experience joining the group and making the payment..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            {/* Bug Report */}
            <div>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  onChange={(e) => setShowBugReport(e.target.checked)}
                  checked={showBugReport}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  I encountered an issue during this task
                </span>
              </label>
              {showBugReport && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bug Report
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      className="w-full p-3 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-500"
                      placeholder="Please describe what went wrong and where..."
                      value={bugReport}
                      onChange={(e) => setBugReport(e.target.value)}
                    />
                    <div className="absolute -top-2 right-2 bg-white px-1 text-xs text-red-500">
                      <AlertCircle className="inline w-4 h-4 mr-1" />
                      Bug Report
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate this task
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Confirmation */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="confirmation"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <label htmlFor="confirmation" className="text-sm text-gray-700">
                I confirm I joined the assigned Chama and made the 1 cUSD payment
                <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Extra Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                rows={2}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                placeholder="Any other feedback or suggestions..."
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </form>
        </div>
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

export default Task2Form;

// https://gateway.pinata.cloud/ipfs/bafkreifv4cu5kxxhksbsomvjdqe7eaebeal2hef22obfgukgqmus3ujixm