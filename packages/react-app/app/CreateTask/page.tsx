'use client'
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Target, Users, DollarSign, Sparkles, Clock, Plus, Trash2, 
  Save, AlertCircle, CheckCircle, Eye, FileText, Star, Upload, ChevronDown,
  Info, Zap, Gift, Calendar
} from 'lucide-react';
import { createCompleteTask } from '@/lib/Prismafnctns';
import { ContactMethod, SubtaskType } from '@prisma/client';
import BottomNavigation from '@/components/BottomNavigation';
import { useAccount, useWriteContract } from 'wagmi';
import { getTotalTasks } from '@/lib/ReadFunctions';
import { contractAbi, contractAddress, cUSDAddress } from '@/contexts/constants';
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { erc20Abi, parseEther } from 'viem';
import {config} from "@/providers/AppProvider";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';


const TaskCreationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [description, setDescription] = useState('');
  const [baseReward, setBaseReward] = useState('');
  const [maxBonusReward, setMaxBonusReward] = useState('');
  const [aiCriteria, setAiCriteria] = useState('');
  const [contactMethod, setContactMethod] = useState('EMAIL');
  const [contactInfo, setContactInfo] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);
  const {address} = useAccount();
  const { writeContractAsync } = useWriteContract();
  const router = useRouter();
  
  // Restrictions state
  const [restrictionsEnabled, setRestrictionsEnabled] = useState(false);
  const [ageRestriction, setAgeRestriction] = useState(false);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(65);
  const [genderRestriction, setGenderRestriction] = useState(false);
  const [gender, setGender] = useState('M');
  const [countryRestriction, setCountryRestriction] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState([{
    id: '1',
    title: '',
    description: '',
    type: 'TEXT_INPUT',
    required: true,
    options: ''
  }]);

  // Available countries for selection
  const availableCountries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KE', name: 'Kenya' },
    { code: 'GH', name: 'Ghana' },
    { code: 'UG', name: 'Uganda' }
  ];

  // Available subtask types
  const availableSubtaskTypes = [
    { value: 'TEXT_INPUT', label: '📝 Text Input', description: 'Free text response' },
    { value: 'MULTIPLE_CHOICE', label: '☑️ Multiple Choice', description: 'Select from options' },
    { value: 'CHOICE_SELECTION', label: '🎯 Choice Selection', description: 'Single choice from options' },
    { value: 'RATING', label: '⭐ Rating', description: 'Numeric rating scale' },
    { value: 'FILE_UPLOAD', label: '📎 File Upload', description: 'Upload files or documents' }
  ];

  const steps = [
    { id: 1, name: 'Task Info', icon: Target, description: 'Basic details' },
    { id: 2, name: 'Rewards', icon: DollarSign, description: 'Payment structure' },
    { id: 3, name: 'Quality', icon: Sparkles, description: 'AI criteria' },
    { id: 4, name: 'Restrictions', icon: Users, description: 'Participant filters' },
    { id: 5, name: 'Contact', icon: Users, description: 'Communication' },
    { id: 6, name: 'Tasks', icon: FileText, description: 'Breakdown' }
  ];

  const calculateTotalRequired = () => {
    const base = parseFloat(baseReward) || 0;
    const bonus = parseFloat(maxBonusReward) || 0;
    return (base + bonus) * maxParticipants;
  };

  const addSubtask = () => {
    const newSubtask = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'TEXT_INPUT',
      required: true,
      options: ''
    };
    setSubtasks([...subtasks, newSubtask]);
  };

  const removeSubtask = (id: string) => {
    if (subtasks.length > 1) {
      setSubtasks(subtasks.filter(s => s.id !== id));
    }
  };

  const updateSubtask = (id: string, field: string, value: string | boolean) => {
    setSubtasks(subtasks.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const blockChainId = (await getTotalTasks()).toString();
  
      // Prepare task data
      const taskData = {
        title,
        description,
        blockChainId,
        maxParticipants,
        baseReward,
        maxBonusReward,
        aiCriteria,
        contactMethod: contactMethod as ContactMethod,
        contactInfo,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        restrictionsEnabled,
        ageRestriction,
        minAge: ageRestriction ? minAge : undefined,
        maxAge: ageRestriction ? maxAge : undefined,
        genderRestriction,
        gender: genderRestriction ? gender : undefined,
        countryRestriction,
        countries: countryRestriction ? countries : undefined,
      };
  
      const subtasksData = subtasks.map(subtask => ({
        title: subtask.title,
        description: subtask.description || undefined,
        type: subtask.type as SubtaskType,
        required: subtask.required,
        options: subtask.type === 'MULTIPLE_CHOICE' ? JSON.stringify(subtask.options?.split(/[,\n]/).map(opt => opt.trim()).filter(opt => opt.length > 0) || []) : subtask.options || undefined,
      }));
      
      
  
      // Blockchain logic
      const totalAmount = await calculateTotalRequired();
      const amountInWei = parseEther(totalAmount.toString());
  
      const maxAmountUserGets = Number(maxBonusReward) + Number(baseReward);
      const maxAmountUserGetsInWei = parseEther(maxAmountUserGets.toString());
  
      // 1. Approve allowance
      const approveTx = await writeContractAsync({
        address: cUSDAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, amountInWei],
      });
  
      // Wait for confirmation
      await waitForTransactionReceipt(config, { 
        hash: approveTx,
        pollingInterval: 3000 // 3s
      });

  
      let allowance = 0n;
        for (let i = 0; i < 5; i++) {
          allowance = await readContract(config, {
            address: cUSDAddress,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address, contractAddress],
          });
          if (allowance >= amountInWei) break;
          await new Promise(res => setTimeout(res, 2000)); // wait 2s
        }

      console.log("allowance", allowance);
  
      if (allowance < amountInWei) {
        throw new Error("Allowance not set correctly");
      }
  
      // 2. Call createTask
      const registerTx = await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: "createTask",
        args: [amountInWei, maxAmountUserGetsInWei],
      });
  
      await waitForTransactionReceipt(config, { hash: registerTx });
  
      // 3. Save task in DB
      const createdTask = await createCompleteTask(address, taskData, subtasksData);
  
      if (createdTask) {
        toast("Task created successfully!");
        resetForm();
        router.push("/Start");
      } else {
        throw new Error("Failed to create task in DB");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(`Error creating task: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const getStepValidation = (step: number) => {
    switch (step) {
      case 1: return title.trim().length > 0 && description.trim().length > 0 && maxParticipants > 0;
      case 2: return parseFloat(baseReward) > 0 && parseFloat(maxBonusReward) >= 0;
      case 3: return aiCriteria.trim().length > 10;
      case 4: return true; // Restrictions are optional
      case 5: return contactInfo.trim().length > 0;
      case 6: return subtasks.every(s => s.title.trim().length > 0 && s.type);
      default: return false;
    }
  };

  // Enhanced validation with detailed feedback
  const getValidationErrors = () => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push('Task title is required');
    if (!description.trim()) errors.push('Task description is required');
    if (maxParticipants <= 0) errors.push('Max participants must be greater than 0');
    if (parseFloat(baseReward) <= 0) errors.push('Base reward must be greater than 0');
    if (parseFloat(maxBonusReward) < 0) errors.push('Max bonus reward cannot be negative');
    if (!aiCriteria.trim()) errors.push('AI criteria is required');
    if (aiCriteria.trim().length < 10) errors.push('AI criteria must be at least 10 characters');
    if (!contactInfo.trim()) errors.push('Contact information is required');
    
    // Validate subtasks
    subtasks.forEach((subtask, index) => {
      if (!subtask.title.trim()) errors.push(`Subtask ${index + 1} title is required`);
      if (subtask.type === 'MULTIPLE_CHOICE' && !subtask.options?.trim()) {
        errors.push(`Subtask ${index + 1} options are required for multiple choice`);
      }
    });
    
    return errors;
  };

  // Function to reset form to initial state
  const resetForm = () => {
    setCurrentStep(1);
    setTitle('');
    setDescription('');
    setMaxParticipants(10);
    setBaseReward('');
    setMaxBonusReward('');
    setAiCriteria('');
    setContactMethod('EMAIL');
    setContactInfo('');
    setExpiresAt('');
    setSubtasks([{
      id: '1',
      title: '',
      description: '',
      type: 'TEXT_INPUT',
      required: true,
      options: ''
    }]);
    setRestrictionsEnabled(false);
    setAgeRestriction(false);
    setMinAge(18);
    setMaxAge(65);
    setGenderRestriction(false);
    setGender('M');
    setCountryRestriction(false);
    setCountries([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-r from-indigo-300/25 to-purple-300/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/90 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 group">
                <ArrowLeft className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
                <p className="text-gray-500 text-sm">Build engaging tasks and reward participants</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 py-4 pb-24">
        <form onSubmit={handleSubmit}>
          {/* Enhanced Progress Steps */}
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white/50 shadow-xl overflow-hidden">
            <div className="flex flex-col items-center justify-between mb-4 space-y-2">
              <h3 className="text-base font-semibold text-gray-800">Setup Progress</h3>
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
                Step {currentStep} of 6
              </span>
            </div>
            
            {/* Mobile progress steps */}
            <div className="mb-4">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center">
                  {React.createElement(steps[currentStep - 1].icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <div className="text-sm font-semibold text-indigo-600">
                    {steps[currentStep - 1].name}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step Navigation */}
            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
              
              <button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 6 || !getStepValidation(currentStep)}
                className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              >
                <span>Next</span>
                <ArrowLeft className="w-3 h-3 rotate-180" />
              </button>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/50 shadow-xl">
              <div className="flex flex-col items-center space-y-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl w-fit">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="text-xl font-bold text-gray-900">Task Information</h2>
                  <p className="text-gray-500 mt-1 text-sm">Define what participants will accomplish</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 text-base"
                    placeholder="Enter an engaging title..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    Max Participants *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                      min="1"
                      className="w-full pl-12 pr-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    Task Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 resize-none text-sm"
                    placeholder="Describe what participants need to do in detail. Be specific about requirements and expectations..."
                  />
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <p className={`${description.length < 200 ? 'text-red-500' : description.length > 500 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {description.length} characters
                    </p>
                    <p className="text-gray-400">
                      Recommended: 200-500 characters
                    </p>
                  </div>
                  {description.length > 0 && description.length < 200 && (
                    <p className="text-xs text-red-500 mt-1">Description is too short. Please provide more details.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/50 shadow-xl">
              <div className="flex flex-col items-center space-y-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl w-fit">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="text-xl font-bold text-gray-900">Reward Structure</h2>
                  <p className="text-gray-500 mt-1 text-sm">Set up incentives for quality participation</p>
                </div>
              </div>
              
              <div className="space-y-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Base Reward (cUSD) *
                    </label>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400" />
                      <div className="invisible group-hover:visible absolute bottom-6 left-0 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Guaranteed payment for all participants
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-medium text-sm">$</span>
                    <input
                      type="number"
                      value={baseReward}
                      onChange={(e) => setBaseReward(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-400 transition-all duration-200 text-base"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Max Bonus (cUSD) *
                    </label>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400" />
                      <div className="invisible group-hover:visible absolute bottom-6 left-0 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Additional reward for high-quality submissions
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-medium text-sm">$</span>
                    <input
                      type="number"
                      value={maxBonusReward}
                      onChange={(e) => setMaxBonusReward(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-400 transition-all duration-200 text-base"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Total Calculation - Mobile Optimized */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Gift className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Per Participant</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      ${((parseFloat(baseReward) || 0) + (parseFloat(maxBonusReward) || 0)).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Participants</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {maxParticipants}
                    </p>
                  </div>
                  </div>
                  <div className="text-center mt-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Total Required</span>
                    </div>
                    <p className="text-3xl font-bold text-green-700">
                      ${calculateTotalRequired().toFixed(2)}
                    </p>
                  </div>
                
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-blue-800">How rewards work</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      All participants receive the base reward. Bonus rewards are distributed based on AI rating of submission quality (0-100% of max bonus).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/50 shadow-xl">
              <div className="flex flex-col items-center space-y-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl w-fit">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="text-xl font-bold text-gray-900">AI Rating Criteria</h2>
                  <p className="text-gray-500 mt-1 text-sm">Define quality standards for automatic evaluation</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    Rating Criteria *
                  </label>
                  <textarea
                    value={aiCriteria}
                    onChange={(e) => setAiCriteria(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 resize-none text-sm"
                    placeholder="Example: Look for detailed feedback, specific suggestions, constructive criticism, and actionable insights. Higher ratings for comprehensive responses that show understanding of the task."
                  />
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <p className={`${aiCriteria.length < 10 ? 'text-red-500' : aiCriteria.length < 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {aiCriteria.length} characters
                    </p>
                    <p className="text-gray-400">
                      Be specific and detailed
                    </p>
                  </div>
                  {aiCriteria.length > 0 && aiCriteria.length < 10 && (
                    <p className="text-xs text-red-500 mt-1">AI criteria is too short. Please provide more specific instructions.</p>
                  )}
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-3 text-sm">Tips for effective AI criteria:</h4>
                  <ul className="space-y-2 text-xs text-purple-700">
                    <li className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                      <span>Be specific about what constitutes quality work</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                      <span>Include examples of good vs poor responses</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                      <span>Mention required elements or structure</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                      <span>Specify length or depth requirements</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/50 shadow-xl">
              <div className="flex flex-col items-center space-y-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl w-fit">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="text-xl font-bold text-gray-900">Participant Restrictions</h2>
                  <p className="text-gray-500 mt-1 text-sm">Set filters for who can participate</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Main toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Enable Restrictions</h3>
                    <p className="text-sm text-gray-600">Turn on to filter participants</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restrictionsEnabled}
                      onChange={(e) => setRestrictionsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {restrictionsEnabled && (
                  <div className="space-y-6">
                    {/* Age Restriction */}
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Age Restriction</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ageRestriction}
                            onChange={(e) => setAgeRestriction(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      
                      {ageRestriction && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Age *</label>
                            <input
                              type="number"
                              value={minAge}
                              onChange={(e) => setMinAge(parseInt(e.target.value))}
                              min="13"
                              max="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Age *</label>
                            <input
                              type="number"
                              value={maxAge}
                              onChange={(e) => setMaxAge(parseInt(e.target.value)) }
                              min="13"
                              max="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gender Restriction */}
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Gender Restriction</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={genderRestriction}
                            onChange={(e) => setGenderRestriction(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      
                      {genderRestriction && (
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="M"
                              checked={gender === 'M'}
                              onChange={(e) => setGender(e.target.value)}
                              className="mr-2 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Male</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="F"
                              checked={gender === 'F'}
                              onChange={(e) => setGender(e.target.value)}
                              className="mr-2 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Female</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!restrictionsEnabled && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-800">No Restrictions</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          Your task will be open to all participants. Enable restrictions above if you want to filter participants by age, gender, or location.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/50 shadow-xl">
              <div className="flex flex-col items-center space-y-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl w-fit">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
                  <p className="text-gray-500 mt-1 text-sm">How participants can reach you</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    Contact Method *
                  </label>
                  <div className="relative">
                    <select
                      value={contactMethod}
                      onChange={(e) => setContactMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 appearance-none text-sm"
                    >
                      <option value="EMAIL">📧 Email</option>
                      <option value="WHATSAPP">📱 WhatsApp</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    Contact Info *
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-sm"
                    placeholder={contactMethod === 'EMAIL' ? 'your@email.com' : contactMethod === 'WHATSAPP' ? '+1234567890' : 'email@example.com, +1234567890'}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    Task Deadline (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/90 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Leave empty for no deadline. Tasks without deadlines run until manually closed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/50 shadow-xl">
                              <div className="flex flex-col items-center justify-between mb-6 space-y-3">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl w-fit">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 text-center">
                      <h2 className="text-xl font-bold text-gray-900">Subtasks</h2>
                      <p className="text-gray-500 mt-1 text-sm">Break down your task into manageable parts</p>
                    </div>
                  </div>
                </div>

              <div className="space-y-4">
                {subtasks.map((subtask, index) => (
                  <div key={subtask.id} className="bg-white/90 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-3">
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="truncate">Subtask {index + 1}</span>
                      </h3>
                      {subtasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubtask(subtask.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4 mb-4">
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-800">
                          Subtask Title *
                        </label>
                        <input
                          type="text"
                          value={subtask.title}
                          onChange={(e) => updateSubtask(subtask.id, 'title', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 text-sm"
                          placeholder="Enter subtask title"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-800">
                          Input Type *
                        </label>
                        <div className="relative">
                          <select
                            value={subtask.type}
                            onChange={(e) => updateSubtask(subtask.id, 'type', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 appearance-none text-sm"
                          >
                            {availableSubtaskTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 space-y-3">
                      <label className="block text-sm font-semibold text-gray-800">
                        Description (Optional)
                      </label>
                      <textarea
                        value={subtask.description}
                        onChange={(e) => updateSubtask(subtask.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 resize-none text-sm"
                        placeholder="Additional details about this subtask..."
                      />
                    </div>

                    {subtask.type === 'MULTIPLE_CHOICE' && (
                      <div className="mb-4 space-y-3">
                        <label className="block text-sm font-semibold text-gray-800">
                          Options (one per line) *
                        </label>
                        <textarea
                          value={subtask.options || ''}
                          onChange={(e) => updateSubtask(subtask.id, 'options', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 resize-none text-sm"
                          placeholder="Option 1, Option 2, Option 3&#10;Or use new lines"
                        />
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-between space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subtask.required}
                          onChange={(e) => updateSubtask(subtask.id, 'required', e.target.checked)}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all duration-200"
                        />
                        <span className="text-sm font-semibold text-gray-800">Required field</span>
                      </label>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {subtask.type === 'TEXT_INPUT' && <FileText className="w-4 h-4" />}
                        {subtask.type === 'MULTIPLE_CHOICE' && <CheckCircle className="w-4 h-4" />}
                        {subtask.type === 'RATING' && <Star className="w-4 h-4" />}
                        {subtask.type === 'FILE_UPLOAD' && <Upload className="w-4 h-4" />}
                        <span className="capitalize">{subtask.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Floating Add Subtask Button - Better UX */}
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm w-fit"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Subtask</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-orange-800">Subtask Guidelines</h4>
                    <p className="text-xs text-orange-700 mt-1">
                      Keep subtasks focused and specific. Each subtask should have a clear purpose and contribute to the overall task goal. Consider the time participants will need for each subtask.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Submit Section */}
          {currentStep === 6 && (
            <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Launch?</h3>
                <p className="text-gray-600 text-sm">Review your task details and submit to go live</p>
              </div>

              {/* Validation Errors */}
              {getValidationErrors().length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-red-800 mb-2">Please fix the following issues:</h4>
                      <ul className="space-y-1 text-xs text-red-700">
                        {getValidationErrors().map((error, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span>•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Task Summary - Mobile Optimized */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <Target className="w-4 h-6 text-indigo-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Task Type</div>
                  <div className="font-semibold text-gray-900 text-xs">{subtasks.length} Subtasks</div>
                </div>
                
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <Users className="w-4 h-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Max Participants</div>
                  <div className="font-semibold text-gray-900 text-xs">{maxParticipants}</div>
                </div>
                
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <DollarSign className="w-4 h-6 text-green-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Total Budget</div>
                  <div className="font-semibold text-gray-900 text-xs">${calculateTotalRequired().toFixed(2)}</div>
                </div>
                
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <Clock className="w-4 h-6 text-purple-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Deadline</div>
                  <div className="font-semibold text-gray-900 text-xs">{expiresAt ? 'Set' : 'Open'}</div>
                </div>
              </div>

              {/* Restrictions Summary */}
              {restrictionsEnabled && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 mb-6">
                  <h4 className="font-semibold text-orange-800 mb-3 text-sm">Active Restrictions:</h4>
                  <div className="space-y-2 text-xs text-orange-700">
                    {ageRestriction && (
                      <div className="flex items-center space-x-2">
                        <span>•</span>
                        <span>Age: {minAge} - {maxAge} years</span>
                      </div>
                    )}
                    {genderRestriction && (
                      <div className="flex items-center space-x-2">
                        <span>•</span>
                        <span>Gender: {gender === 'M' ? 'Male' : 'Female'}</span>
                      </div>
                    )}
                    {countryRestriction && countries.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span>•</span>
                        <span>Countries: {countries.length} selected</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 justify-center">
                <button
                  type="button"
                  className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 text-sm"
                >
                  <Eye className="w-5 h-5" />
                  <span>Preview Task</span>
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || getValidationErrors().length > 0}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-12 py-4 rounded-lg font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      <span>Create Task</span>
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  By creating this task, you agree to pay the specified rewards to participants who complete the requirements.
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default TaskCreationForm;