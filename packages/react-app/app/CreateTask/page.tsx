"use client";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Target,
  Users,
  DollarSign,
  Sparkles,
  Clock,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
  Star,
  Upload,
  ChevronDown,
  Info,
  Zap,
  Gift,
  Calendar,
  Mail,
} from "lucide-react";
import { createCompleteTask, getAllFarcasterUsers } from "@/lib/Prismafnctns";
import { ContactMethod, SubtaskType } from "@prisma/client";
import BottomNavigation from "@/components/BottomNavigation";
import { useAccount, useWriteContract } from "wagmi";
import { getTotalTasks } from "@/lib/ReadFunctions";
import {
  contractAbi,
  contractAddress,
  USDCAddress,
} from "@/contexts/constants";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { erc20Abi, parseUnits } from "viem";
import { wagmiConfig } from "@/providers/AppProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { improveCriteria } from "@/lib/AiRating";
import { sendFarcasterNotification } from "@/lib/FarcasterNotify";

const TaskCreationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [description, setDescription] = useState("");
  const [baseReward, setBaseReward] = useState("");
  const [maxBonusReward, setMaxBonusReward] = useState("");
  const [aiCriteria, setAiCriteria] = useState("");
  const [contactMethod, setContactMethod] = useState("EMAIL");
  const [contactInfo, setContactInfo] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);
  const [isImprovingCriteria, setIsImprovingCriteria] = useState(false);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const router = useRouter();

  // Restrictions state
  const [restrictionsEnabled, setRestrictionsEnabled] = useState(false);
  const [ageRestriction, setAgeRestriction] = useState(false);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(65);
  const [genderRestriction, setGenderRestriction] = useState(false);
  const [gender, setGender] = useState("M");
  const [countryRestriction, setCountryRestriction] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState([
    {
      id: "1",
      title: "",
      description: "",
      type: "TEXT_INPUT",
      required: true,
      options: "",
    },
  ]);

  // Available countries for selection
  const availableCountries = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "AU", name: "Australia" },
    { code: "JP", name: "Japan" },
    { code: "IN", name: "India" },
    { code: "BR", name: "Brazil" },
    { code: "MX", name: "Mexico" },
    { code: "NG", name: "Nigeria" },
    { code: "ZA", name: "South Africa" },
    { code: "KE", name: "Kenya" },
    { code: "GH", name: "Ghana" },
    { code: "UG", name: "Uganda" },
  ];

  // Country codes for WhatsApp
  const countryCodes = [
    { code: "+1", country: "US/CA", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+55", country: "Brazil", flag: "🇧🇷" },
    { code: "+52", country: "Mexico", flag: "🇲🇽" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+233", country: "Ghana", flag: "🇬🇭" },
    { code: "+256", country: "Uganda", flag: "🇺🇬" },
  ];

  // Available subtask types
  const availableSubtaskTypes = [
    {
      value: "TEXT_INPUT",
      label: "📝 Text Input",
      description: "Free text response",
    },
    {
      value: "MULTIPLE_CHOICE",
      label: "☑️ Multiple Choice",
      description: "Select from options",
    },
    {
      value: "CHOICE_SELECTION",
      label: "🎯 Choice Selection",
      description: "Single choice from options",
    },
    {
      value: "RATING",
      label: "⭐ Rating",
      description: "Numeric rating scale",
    },
    {
      value: "FILE_UPLOAD",
      label: "📎 File Upload",
      description: "Upload files or documents",
    },
  ];

  const steps = [
    { id: 1, name: "Task Info", icon: Target, description: "Basic details" },
    {
      id: 2,
      name: "Rewards",
      icon: DollarSign,
      description: "Payment structure",
    },
    { id: 3, name: "Quality", icon: Sparkles, description: "AI criteria" },
    {
      id: 4,
      name: "Restrictions",
      icon: Users,
      description: "Participant filters",
    },
    { id: 5, name: "Contact", icon: Users, description: "Communication" },
    { id: 6, name: "Tasks", icon: FileText, description: "Breakdown" },
  ];

  const calculateTotalRequired = () => {
    const base = parseFloat(baseReward) || 0;
    const bonus = parseFloat(maxBonusReward) || 0;
    return (base + bonus) * maxParticipants;
  };

  const addSubtask = () => {
    const newSubtask = {
      id: Date.now().toString(),
      title: "",
      description: "",
      type: "TEXT_INPUT",
      required: true,
      options: "",
    };
    setSubtasks([...subtasks, newSubtask]);
  };

  const removeSubtask = (id: string) => {
    if (subtasks.length > 1) {
      setSubtasks(subtasks.filter((s) => s.id !== id));
    }
  };

  const updateSubtask = (
    id: string,
    field: string,
    value: string | boolean
  ) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleImproveCriteria = async () => {
    if (!aiCriteria.trim() || aiCriteria.length < 10) {
      toast.error("Please write some criteria first (at least 10 characters)");
      return;
    }

    setIsImprovingCriteria(true);
    try {
      const improvedCriteria = await improveCriteria(aiCriteria);
      setAiCriteria(improvedCriteria);
      toast.success("AI has improved your criteria!");
    } catch (error) {
      console.error("Error improving criteria:", error);
      toast.error(
        `Failed to improve criteria: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsImprovingCriteria(false);
    }
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
      alert("Please connect your wallet first");
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
        contactInfo:
          contactMethod === "WHATSAPP"
            ? `${countryCode}${contactInfo}`
            : contactInfo,
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

      const subtasksData = subtasks.map((subtask) => ({
        title: subtask.title,
        description: subtask.description || undefined,
        type: subtask.type as SubtaskType,
        required: subtask.required,
        options:
          subtask.type === "MULTIPLE_CHOICE"
            ? JSON.stringify(
              subtask.options
                ?.split(/[,\n]/)
                .map((opt) => opt.trim())
                .filter((opt) => opt.length > 0) || []
            )
            : subtask.type === "CHOICE_SELECTION"
              ? JSON.stringify(
                subtask.options
                  ?.split(/[,\n]/)
                  .map((opt) => opt.trim())
                  .filter((opt) => opt.length > 0) || []
              )
              : subtask.options || undefined,
      }));

      // Blockchain logic
      const totalAmount = calculateTotalRequired();
      const amountInWei = parseUnits(totalAmount.toString(), 6);

      const maxAmountUserGets = Number(maxBonusReward) + Number(baseReward);
      const maxAmountUserGetsInWei = parseUnits(maxAmountUserGets.toString(), 6);

      // 1. Approve allowance
      const approveTx = await writeContractAsync({
        address: USDCAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, amountInWei],
      });

      // Wait for confirmation
      await waitForTransactionReceipt(wagmiConfig, {
        hash: approveTx,
        pollingInterval: 3000, // 3s
      });

      let allowance = 0n;
      for (let i = 0; i < 5; i++) {
        allowance = await readContract(wagmiConfig, {
          address: USDCAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, contractAddress],
        });
        if (allowance >= amountInWei) break;
        await new Promise((res) => setTimeout(res, 2000)); // wait 2s
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

      await waitForTransactionReceipt(wagmiConfig, { hash: registerTx });

      // 3. Save task in DB
      const createdTask = await createCompleteTask(
        address,
        taskData,
        subtasksData
      );

      if (createdTask) {
        toast("Task created successfully!");
        resetForm();
        // Notify all users about a newly created task
        const users = await getAllFarcasterUsers();
        const userFids = users
          .map((user) => user.fid)
          .filter((fid) => fid !== null);

        if (userFids.length > 0) {
          await sendFarcasterNotification(
            userFids,
            "🆕 New Task Alert!",
            `A fresh task just dropped: “${title}” 💼\nHead over to Earnbase to submit your feedback and earn rewards!`
          );
        }
        router.push("/Start");
      } else {
        throw new Error("Failed to create task in DB");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(
        `Error creating task: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepValidation = (step: number) => {
    switch (step) {
      case 1:
        return (
          title.trim().length > 0 &&
          description.trim().length > 0 &&
          maxParticipants > 0
        );
      case 2:
        return parseFloat(baseReward) > 0 && parseFloat(maxBonusReward) >= 0;
      case 3:
        return aiCriteria.trim().length > 10;
      case 4:
        return true; // Restrictions are optional
      case 5:
        return contactInfo.trim().length > 0;
      case 6:
        return subtasks.every((s) => s.title.trim().length > 0 && s.type);
      default:
        return false;
    }
  };

  // Enhanced validation with detailed feedback
  const getValidationErrors = () => {
    const errors: string[] = [];

    if (!title.trim()) errors.push("Task title is required");
    if (!description.trim()) errors.push("Task description is required");
    if (maxParticipants <= 0)
      errors.push("Max participants must be greater than 0");
    if (parseFloat(baseReward) <= 0)
      errors.push("Base reward must be greater than 0");
    if (parseFloat(maxBonusReward) < 0)
      errors.push("Max bonus reward cannot be negative");
    if (!aiCriteria.trim()) errors.push("AI criteria is required");
    if (aiCriteria.trim().length < 10)
      errors.push("AI criteria must be at least 10 characters");
    if (!contactInfo.trim()) errors.push("Contact information is required");

    // Validate subtasks
    subtasks.forEach((subtask, index) => {
      if (!subtask.title.trim())
        errors.push(`Subtask ${index + 1} title is required`);
      if (subtask.type === "MULTIPLE_CHOICE" && !subtask.options?.trim()) {
        errors.push(
          `Subtask ${index + 1} options are required for multiple choice`
        );
      }
    });

    return errors;
  };

  // Function to reset form to initial state
  const resetForm = () => {
    setCurrentStep(1);
    setTitle("");
    setDescription("");
    setMaxParticipants(10);
    setBaseReward("");
    setMaxBonusReward("");
    setAiCriteria("");
    setContactMethod("EMAIL");
    setContactInfo("");
    setCountryCode("+1");
    setExpiresAt("");
    setSubtasks([
      {
        id: "1",
        title: "",
        description: "",
        type: "TEXT_INPUT",
        required: true,
        options: "",
      },
    ]);
    setRestrictionsEnabled(false);
    setAgeRestriction(false);
    setMinAge(18);
    setMaxAge(65);
    setGenderRestriction(false);
    setGender("M");
    setCountryRestriction(false);
    setCountries([]);
  };

  return (
    <div className="min-h-screen bg-celo-lt-tan relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-celo-yellow/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-celo-forest/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-celo-purple/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="bg-celo-yellow border-b-4 rounded-b-2xl border-black sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h4 font-gt-alpina font-thin text-black">
                CREATE TASK
              </h1>
              <p className="text-body-s text-celo-body font-thin">
                BUILD ENGAGING TASKS AND REWARD PARTICIPANTS
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm mx-auto px-3 py-4 pb-32">
        <form onSubmit={handleSubmit}>
          {/* Step Content */}
          {currentStep === 1 && (
            <div className="bg-white border-2 border-black p-4">
              <div className="flex flex-col items-center space-y-3 mb-6">
                {/* <div className="p-3 bg-celo-purple w-fit border-2 border-black">
                  <Target className="w-6 h-6 text-white" />
                </div> */}
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                    TASK INFORMATION
                  </h2>
                  <p className="text-body-s font-inter text-black/70 mt-1">
                    Define what participants will accomplish
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-body-s font-inter font-heavy text-black">
                    TASK TITLE *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-m font-inter"
                    placeholder="Enter an engaging title..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-body-s font-inter font-heavy text-black">
                    MAX PARTICIPANTS *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-3 w-5 h-5 text-black/50" />
                    <input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) =>
                        setMaxParticipants(parseInt(e.target.value))
                      }
                      min="1"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-m font-inter"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-body-s font-inter font-heavy text-gray-800">
                    TASK DESCRIPTION *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 resize-none text-body-s font-inter"
                    placeholder="Describe what participants need to do in detail. Be specific about requirements and expectations..."
                  />
                  <div className="flex justify-between items-center mt-2 text-eyebrow">
                    <p
                      className={`font-inter font-heavy ${description.length < 200
                        ? "text-red-500"
                        : description.length > 500
                          ? "text-celo-orange"
                          : "text-celo-forest"
                        }`}
                    >
                      {description.length} CHARACTERS
                    </p>
                    <p className="text-black/50 font-inter">
                      Recommended: 200-500 characters
                    </p>
                  </div>
                  {description.length > 0 && description.length < 200 && (
                    <p className="text-eyebrow text-red-500 mt-1 font-inter font-heavy">
                      Description is too short. Please provide more details.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white border-2 border-black p-4">
              <div className="flex flex-col items-center space-y-3 mb-6">
                <div className="p-3 bg-celo-forest w-fit border-2 border-black">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="text-h3 font-gt-alpina font-thin text-black tracking-tight">
                    REWARD STRUCTURE
                  </h2>
                  <p className="text-body-s font-inter text-black/70 mt-1">
                    Set up incentives for quality participation
                  </p>
                </div>
              </div>

              <div className="space-y-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="block text-body-s font-inter font-heavy text-black">
                      BASE REWARD (USDC) *
                    </label>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-black/50" />
                      <div className="invisible group-hover:visible absolute bottom-6 left-0 bg-black text-white text-eyebrow px-2 py-1 whitespace-nowrap z-10 border-2 border-black font-inter">
                        Guaranteed payment for all participants
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-5 text-black/70  text-body-s font-inter">
                      $
                    </span>
                    <input
                      type="number"
                      value={baseReward}
                      onChange={(e) => setBaseReward(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-m font-inter"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="block text-body-s font-inter font-heavy text-gray-800">
                      MAX BONUS (USDC) *
                    </label>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-black/50" />
                      <div className="invisible group-hover:visible absolute bottom-6 left-0 bg-black text-white text-eyebrow px-2 py-1 whitespace-nowrap z-10 border-2 border-black font-inter">
                        Additional reward for high-quality submissions
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-5 text-black/70  text-body-s font-inter">
                      $
                    </span>
                    <input
                      type="number"
                      value={maxBonusReward}
                      onChange={(e) => setMaxBonusReward(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-m font-inter"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Total Calculation - Mobile Optimized */}
              <div className="bg-celo-lt-tan border-2 border-black p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Gift className="w-5 h-5 text-celo-forest" />
                      <span className="text-body-s font-inter font-heavy text-celo-forest">
                        PER PARTICIPANT
                      </span>
                    </div>
                    <p className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                      $
                      {(
                        (parseFloat(baseReward) || 0) +
                        (parseFloat(maxBonusReward) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-celo-purple" />
                      <span className="text-body-s font-inter font-heavy text-celo-purple">
                        PARTICIPANTS
                      </span>
                    </div>
                    <p className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                      {maxParticipants}
                    </p>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-celo-forest" />
                    <span className="text-body-s font-inter font-heavy text-celo-forest">
                      TOTAL REQUIRED
                    </span>
                  </div>
                  <p className="text-h3 font-gt-alpina font-thin text-black tracking-tight">
                    ${calculateTotalRequired().toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-celo-yellow border-2 border-black p-4">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-body-s font-inter font-heavy text-black">
                      HOW REWARDS WORK
                    </h4>
                    <p className="text-body-s font-inter text-black/70 mt-1">
                      All participants receive the base reward. Bonus rewards
                      are distributed based on AI rating of submission quality
                      (0-100% of max bonus).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white border-2 border-black p-4">
              <div className="flex flex-col items-center space-y-3 mb-6">
                <div className="p-3 bg-celo-purple w-fit border-2 border-black">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="text-h3 font-gt-alpina font-thin text-black tracking-tight">
                    AI RATING CRITERIA
                  </h2>
                  <p className="text-body-s font-inter text-black/70 mt-1">
                    Define quality standards for automatic evaluation
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-col-2 justify-between">
                    <label className="block text-body-s font-inter font-heavy text-black">
                      RATING CRITERIA *
                    </label>
                    {aiCriteria.length >= 10 && (
                      <button
                        type="button"
                        onClick={handleImproveCriteria}
                        disabled={isImprovingCriteria}
                        className="flex items-center gap-2 text-celo-forest hover:text-white hover:bg-celo-forest disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 px-2 py-1"
                      >
                        {isImprovingCriteria ? (
                          <>
                            <span className="text-eyebrow font-inter font-heavy">
                              IMPROVING...
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span className="text-eyebrow font-inter font-heavy">
                              IMPROVE WITH AI
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      value={aiCriteria}
                      onChange={(e) => setAiCriteria(e.target.value)}
                      rows={6}
                      disabled={isImprovingCriteria}
                      className={`w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 resize-none text-body-s font-inter ${isImprovingCriteria
                        ? "border-celo-forest  cursor-not-allowed "
                        : ""
                        }`}
                      placeholder="Example: Look for detailed feedback, specific suggestions, constructive criticism, and actionable insights. Higher ratings for comprehensive responses that show understanding of the task."
                    />
                    {isImprovingCriteria && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200 border-4 border-gray-300">
                        <div className="flex items-center space-x-2 text-celo-forest">
                          <div className="w-4 h-4 border-2 border-celo-forest border-t-transparent animate-spin"></div>
                          <span className="text-body-s font-inter font-heavy">
                            ENHANCING YOUR CRITERIA...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-eyebrow">
                    <p
                      className={`font-inter font-heavy ${aiCriteria.length < 10
                        ? "text-red-500"
                        : aiCriteria.length < 50
                          ? "text-celo-orange"
                          : "text-celo-forest"
                        }`}
                    >
                      {aiCriteria.length} CHARACTERS
                    </p>
                    <p className="text-black/50 font-inter">
                      Be specific and detailed
                    </p>
                  </div>
                  {aiCriteria.length > 0 && aiCriteria.length < 10 && (
                    <p className="text-eyebrow text-red-500 mt-1 font-inter font-heavy">
                      AI criteria is too short. Please provide more specific
                      instructions.
                    </p>
                  )}
                </div>

                <div className="bg-celo-purple border-2 border-black p-4">
                  <h4 className="font-inter font-heavy text-white mb-3 text-body-s">
                    TIPS FOR EFFECTIVE AI CRITERIA:
                  </h4>
                  <ul className="space-y-2 text-eyebrow text-white">
                    <li className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                      <span className="font-inter">
                        Be specific about what constitutes quality work
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                      <span className="font-inter">
                        Include examples of good vs poor responses
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                      <span className="font-inter">
                        Mention required elements or structure
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                      <span className="font-inter">
                        Specify length or depth requirements
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )
          }
          {/* Restrictions */}
          {
            currentStep === 4 && (
              <div className="bg-white border-2 border-black p-4">
                <div className="flex flex-col items-center space-y-3 mb-6">
                  <div className="p-3 bg-celo-orange w-fit border-2 border-black">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 text-center">
                    <h2 className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                      PARTICIPANT RESTRICTIONS
                    </h2>
                    <p className="text-body-s font-inter text-black/70 mt-1">
                      Set filters for who can participate
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Main toggle */}
                  <div className="flex items-center justify-between p-4 bg-celo-lt-tan border-2 border-black">
                    <div>
                      <h3 className="font-inter font-heavy text-black text-body-s">
                        ENABLE RESTRICTIONS
                      </h3>
                      <p className="text-body-s font-inter text-black/70">
                        Turn on to filter participants
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 border-2  text-[11px] font-inter font-heavy ${restrictionsEnabled
                          ? "bg-celo-forest border-celo-forest text-white"
                          : "bg-white text-black border-black"
                          }`}
                      >
                        {restrictionsEnabled ? "ON" : "OFF"}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restrictionsEnabled}
                          onChange={(e) =>
                            setRestrictionsEnabled(e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-celo-dk-tan peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-celo-purple/20 border-2 border-black peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-celo-purple"></div>
                      </label>
                    </div>
                  </div>

                  {restrictionsEnabled && (
                    <div className="space-y-6">
                      {/* Age Restriction */}
                      <div className="p-4 bg-white border-2 border-black">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-inter font-heavy text-black text-body-s">
                            AGE RESTRICTION
                          </h4>
                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-2 py-1 border-2 border-black text-[11px] font-inter font-heavy ${ageRestriction
                                ? "bg-celo-forest text-white"
                                : "bg-white text-black"
                                }`}
                            >
                              {ageRestriction ? "ON" : "OFF"}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ageRestriction}
                                onChange={(e) =>
                                  setAgeRestriction(e.target.checked)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-celo-dk-tan peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-celo-purple/20 border-2 border-black peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-celo-purple"></div>
                            </label>
                          </div>
                        </div>

                        {ageRestriction && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-body-s font-inter font-heavy text-black mb-2">
                                MINIMUM AGE *
                              </label>
                              <input
                                type="number"
                                value={minAge}
                                onChange={(e) =>
                                  setMinAge(parseInt(e.target.value))
                                }
                                min="13"
                                max="100"
                                className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none focus:border-celo-yellow transition-all duration-200 text-body-s font-inter"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-body-s font-inter font-heavy text-black mb-2">
                                MAXIMUM AGE *
                              </label>
                              <input
                                type="number"
                                value={maxAge}
                                onChange={(e) =>
                                  setMaxAge(parseInt(e.target.value))
                                }
                                min="13"
                                max="100"
                                className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none focus:border-celo-yellow transition-all duration-200 text-body-s font-inter"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gender Restriction */}
                      <div className="p-4 bg-white border-2 border-black">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-inter font-heavy text-black text-body-s">
                            GENDER RESTRICTION
                          </h4>
                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-2 py-1 border-2 border-black text-[11px] font-inter font-heavy ${genderRestriction
                                ? "bg-celo-forest text-white"
                                : "bg-white text-black"
                                }`}
                            >
                              {genderRestriction ? "ON" : "OFF"}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={genderRestriction}
                                onChange={(e) =>
                                  setGenderRestriction(e.target.checked)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-celo-dk-tan peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-celo-purple/20 border-2 border-black peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-celo-purple"></div>
                            </label>
                          </div>
                        </div>

                        {genderRestriction && (
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="gender"
                                value="M"
                                checked={gender === "M"}
                                onChange={(e) => setGender(e.target.value)}
                                className="mr-2 text-celo-purple focus:ring-celo-purple"
                              />
                              <span className="text-body-s font-inter text-black">
                                Male
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="gender"
                                value="F"
                                checked={gender === "F"}
                                onChange={(e) => setGender(e.target.value)}
                                className="mr-2 text-celo-purple focus:ring-celo-purple"
                              />
                              <span className="text-body-s font-inter text-black">
                                Female
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!restrictionsEnabled && (
                    <div className="p-4 bg-celo-yellow border-2 border-black">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-body-s font-inter font-heavy text-black">
                            NO RESTRICTIONS
                          </h4>
                          <p className="text-body-s font-inter text-black/70 mt-1">
                            Your task will be open to all participants. Enable
                            restrictions above if you want to filter participants
                            by age, gender, or location.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }
          {/* Contact Information */}
          {
            currentStep === 5 && (
              <div className="bg-white border-2 border-black p-4">
                <div className="flex flex-col items-center space-y-3 mb-6">
                  <div className="p-3 bg-celo-lime w-fit border-2 border-black">
                    <Mail className="w-6 h-6 text-black" />
                  </div>
                  <div className="min-w-0 flex-1 text-center">
                    <h2 className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                      CONTACT INFORMATION
                    </h2>
                    <p className="text-body-s font-inter text-black/70 mt-1">
                      How participants can reach you
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-body-s font-inter font-heavy text-black">
                      CONTACT METHOD *
                    </label>
                    <div className="relative">
                      <select
                        value={contactMethod}
                        onChange={(e) => setContactMethod(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 appearance-none text-body-m font-inter"
                      >
                        <option value="EMAIL">📧 Email</option>
                        <option value="WHATSAPP">📱 WhatsApp</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-3 w-5 h-5 text-black pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-body-s font-inter font-heavy text-black">
                      CONTACT INFO *
                    </label>
                    {contactMethod === "WHATSAPP" ? (
                      <div className="flex space-x-2">
                        <div className="w-32 relative">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full px-3 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-s font-inter appearance-none"
                          >
                            {countryCodes.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-black pointer-events-none" />
                        </div>
                        <div className="flex-1">
                          <input
                            type="tel"
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-s font-inter"
                            placeholder="1234567890"
                          />
                        </div>
                      </div>
                    ) : (
                      <input
                        type="email"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-s font-inter"
                        placeholder="your@email.com"
                      />
                    )}
                    {contactMethod === "WHATSAPP" && (
                      <p className="text-body-s font-inter text-black/70">
                        Full number will be: {countryCode}
                        {contactInfo || "1234567890"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-body-s font-inter font-heavy text-black">
                      TASK DEADLINE (OPTIONAL)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3 w-5 h-5 text-black" />
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-s font-inter"
                      />
                    </div>
                    <p className="text-body-s font-inter text-black/70 mt-2">
                      Leave empty for no deadline. Tasks without deadlines run
                      until manually closed.
                    </p>
                  </div>
                </div>
              </div>
            )
          }

          {/* Subtasks */}
          {
            currentStep === 6 && (
              <div className="bg-white border-2 border-black p-4">
                <div className="flex flex-col items-center justify-between mb-6 space-y-3">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-celo-orange w-fit border-2 border-black">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 text-center">
                      <h2 className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                        SUBTASKS
                      </h2>
                      <p className="text-body-s font-inter text-black/70 mt-1">
                        Break down your task into manageable parts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {subtasks.map((subtask, index) => (
                    <div
                      key={subtask.id}
                      className="bg-celo-lt-tan border-2 border-black p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-body-l font-inter font-heavy text-black flex items-center space-x-3">
                          <span className="bg-celo-purple text-white w-10 h-10 flex items-center justify-center text-body-s font-inter font-heavy border-2 border-black">
                            {index + 1}
                          </span>
                          <span className="truncate">SUBTASK {index + 1}</span>
                        </h3>
                        {subtasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubtask(subtask.id)}
                            className="p-2 text-celo-orange hover:bg-celo-orange hover:text-white border-2 border-celo-orange transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-4 mb-4">
                        <div className="space-y-3">
                          <label className="block text-body-s font-inter font-heavy text-black">
                            SUBTASK TITLE *
                          </label>
                          <input
                            type="text"
                            value={subtask.title}
                            onChange={(e) =>
                              updateSubtask(subtask.id, "title", e.target.value)
                            }
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 text-body-s font-inter"
                            placeholder="Enter subtask title"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-body-s font-inter font-heavy text-black">
                            INPUT TYPE *
                          </label>
                          <div className="relative">
                            <select
                              value={subtask.type}
                              onChange={(e) =>
                                updateSubtask(subtask.id, "type", e.target.value)
                              }
                              className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 appearance-none text-body-s font-inter"
                            >
                              {availableSubtaskTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-black pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 space-y-3">
                        <label className="block text-body-s font-inter font-heavy text-black">
                          DESCRIPTION (OPTIONAL)
                        </label>
                        <textarea
                          value={subtask.description}
                          onChange={(e) =>
                            updateSubtask(
                              subtask.id,
                              "description",
                              e.target.value
                            )
                          }
                          rows={2}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 resize-none text-body-s font-inter"
                          placeholder="Additional details about this subtask..."
                        />
                      </div>

                      {subtask.type === "MULTIPLE_CHOICE" && (
                        <div className="mb-4 space-y-3">
                          <label className="block text-body-s font-inter font-heavy text-black">
                            OPTIONS (ONE PER LINE) *
                          </label>
                          <textarea
                            value={subtask.options || ""}
                            onChange={(e) =>
                              updateSubtask(subtask.id, "options", e.target.value)
                            }
                            rows={3}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 resize-none text-body-s font-inter"
                            placeholder="Option 1, Option 2, Option 3&#10;Or use new lines"
                          />
                        </div>
                      )}

                      {subtask.type === "CHOICE_SELECTION" && (
                        <div className="mb-4 space-y-3">
                          <label className="block text-body-s font-inter font-heavy text-black">
                            OPTIONS (ONE PER LINE) *
                          </label>
                          <textarea
                            value={subtask.options || ""}
                            onChange={(e) =>
                              updateSubtask(subtask.id, "options", e.target.value)
                            }
                            rows={3}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 focus:outline-none focus:border-celo-forest transition-all duration-200 resize-none text-body-s font-inter"
                            placeholder="Option 1, Option 2, Option 3&#10;Or use new lines"
                          />
                        </div>
                      )}

                      <div className="flex flex-col items-center justify-between space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={subtask.required}
                            onChange={(e) =>
                              updateSubtask(
                                subtask.id,
                                "required",
                                e.target.checked
                              )
                            }
                            className="h-5 w-5 text-celo-forest focus:ring-celo-forest border-black border-2 transition-all duration-200"
                          />
                          <span className="text-body-s font-inter font-heavy text-black">
                            REQUIRED FIELD
                          </span>
                        </label>

                        <div className="flex items-center space-x-2 text-body-s font-inter text-black/70">
                          {subtask.type === "TEXT_INPUT" && (
                            <FileText className="w-4 h-4" />
                          )}
                          {subtask.type === "MULTIPLE_CHOICE" && (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          {subtask.type === "RATING" && (
                            <Star className="w-4 h-4" />
                          )}
                          {subtask.type === "FILE_UPLOAD" && (
                            <Upload className="w-4 h-4" />
                          )}
                          <span className="capitalize">
                            {subtask.type.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Subtask Button */}
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={addSubtask}
                      className="flex items-center space-x-2 bg-celo-forest text-white px-6 py-3 font-inter font-heavy hover:bg-black hover:text-celo-forest transition-all duration-200 border-2 border-black text-body-s"
                    >
                      <Plus className="w-5 h-5" />
                      <span>ADD SUBTASK</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 bg-celo-yellow border-2 border-black p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-body-s font-inter font-heavy text-black">
                        SUBTASK GUIDELINES
                      </h4>
                      <p className="text-body-s font-inter text-black/70 mt-1">
                        Keep subtasks focused and specific. Each subtask should
                        have a clear purpose and contribute to the overall task
                        goal. Consider the time participants will need for each
                        subtask.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {/* Enhanced Submit Section */}
          {
            currentStep === 6 && (
              <div className="mt-6 bg-celo-lt-tan border-2 border-black p-4">
                <div className="text-center mb-6">
                  <h3 className="text-h3 font-gt-alpina font-thin text-black tracking-tight mb-2">
                    READY TO LAUNCH?
                  </h3>
                  <p className="text-body-s font-inter text-black/70">
                    Review your task details and submit to go live
                  </p>
                </div>

                {/* Validation Errors */}
                {getValidationErrors().length > 0 && (
                  <div className="bg-red-500 border-2 border-black p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-body-s font-inter font-heavy text-white mb-2">
                          PLEASE FIX THE FOLLOWING ISSUES:
                        </h4>
                        <ul className="space-y-1 text-eyebrow text-white">
                          {getValidationErrors().map((error, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <span>•</span>
                              <span className="font-inter">{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Summary - Mobile Optimized */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white border-2 border-black p-3 text-center">
                    <Target className="w-4 h-6 text-celo-purple mx-auto mb-1" />
                    <div className="text-eyebrow text-black/70 font-inter">
                      TASK TYPE
                    </div>
                    <div className="font-inter font-heavy text-black text-eyebrow">
                      {subtasks.length} SUBTASKS
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black p-3 text-center">
                    <Users className="w-4 h-6 text-celo-purple mx-auto mb-1" />
                    <div className="text-eyebrow text-black/70 font-inter">
                      MAX PARTICIPANTS
                    </div>
                    <div className="font-inter font-heavy text-black text-eyebrow">
                      {maxParticipants}
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black p-3 text-center">
                    <DollarSign className="w-4 h-6 text-celo-forest mx-auto mb-1" />
                    <div className="text-eyebrow text-black/70 font-inter">
                      TOTAL BUDGET
                    </div>
                    <div className="font-inter font-heavy text-black text-eyebrow">
                      ${calculateTotalRequired().toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black p-3 text-center">
                    <Clock className="w-4 h-6 text-celo-purple mx-auto mb-1" />
                    <div className="text-eyebrow text-black/70 font-inter">
                      DEADLINE
                    </div>
                    <div className="font-inter font-heavy text-black text-eyebrow">
                      {expiresAt ? "SET" : "OPEN"}
                    </div>
                  </div>
                </div>

                {/* Restrictions Summary */}
                {restrictionsEnabled && (
                  <div className="bg-celo-orange border-2 border-black p-4 mb-6">
                    <h4 className="font-inter font-heavy text-black mb-3 text-body-s">
                      ACTIVE RESTRICTIONS:
                    </h4>
                    <div className="space-y-2 text-eyebrow text-black">
                      {ageRestriction && (
                        <div className="flex items-center space-x-2">
                          <span>•</span>
                          <span className="font-inter">
                            Age: {minAge} - {maxAge} years
                          </span>
                        </div>
                      )}
                      {genderRestriction && (
                        <div className="flex items-center space-x-2">
                          <span>•</span>
                          <span className="font-inter">
                            Gender: {gender === "M" ? "Male" : "Female"}
                          </span>
                        </div>
                      )}
                      {countryRestriction && countries.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span>•</span>
                          <span className="font-inter">
                            Countries: {countries.length} selected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting || getValidationErrors().length > 0}
                    className="flex items-center justify-center space-x-3 bg-celo-yellow text-black px-12 py-4 font-inter font-heavy shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-body-l border-2 border-black"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-black border-t-transparent animate-spin"></div>
                        <span>CREATING...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-6 h-6" />
                        <span>CREATE TASK</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-eyebrow text-black/50 font-inter">
                    By creating this task, you agree to pay the specified rewards
                    to participants who complete the requirements.
                  </p>
                </div>
              </div>
            )
          }
        </form >

        {/* Progress Indicator - Below Form Content */}
        < div className="mt-6 px-4" >
          <div className="bg-white border-2 border-black p-3">
            <div className="flex flex-col items-center space-y-3">
              {/* Current Step Info */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-celo-purple text-white flex items-center justify-center border-2 border-black">
                  {React.createElement(steps[currentStep - 1].icon, {
                    className: "w-4 h-4",
                  })}
                </div>
                <div className="text-center">
                  <div className="text-eyebrow font-inter font-heavy text-celo-purple">
                    {steps[currentStep - 1].name}
                  </div>
                  <div className="text-xs font-inter text-black/70">
                    STEP {currentStep} OF 6
                  </div>
                </div>
              </div>

              {/* Progress Dots */}
              <div className="flex space-x-1.5">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`w-2.5 h-2.5 border-2 border-black transition-all duration-300 ${index + 1 === currentStep
                      ? "bg-celo-purple"
                      : index + 1 < currentStep
                        ? "bg-celo-forest"
                        : "bg-white"
                      }`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between w-full">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-1 px-2 py-1.5 text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs font-inter font-heavy border-2 border-black"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    currentStep === 6 || !getStepValidation(currentStep)
                  }
                  className="flex items-center space-x-1 px-3 py-1.5 bg-celo-yellow text-black hover:bg-black hover:text-celo-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs font-inter font-heavy border-2 border-black"
                >
                  <span>NEXT</span>
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div >
      </div >

      <BottomNavigation />
    </div >
  );
};

export default TaskCreationForm;
