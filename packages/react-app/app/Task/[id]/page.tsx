"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Target,
  Users,
  DollarSign,
  Clock,
  FileText,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Eye,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Star,
  Shield,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  Shield as ShieldIcon,
  Plus,
  Minus,
  Zap,
  ChevronRight,
  CalendarDays,
  Tag,
  Award as AwardIcon,
  Coins,
  Play,
  ChevronDown,
  Heart,
  Share2,
  Bookmark,
  X,
} from "lucide-react";
import {
  getTaskById,
  TaskWithEligibility,
  renderTaskIcon,
  formatReward,
  getTimeLeft,
} from "@/lib/taskService";
import BottomNavigation from "@/components/BottomNavigation";
import SelfModal from "@/components/SelfModal";
import FormGenerator from "@/components/FormGenerator";
import {
  hasUserSubmittedToTask,
  getTaskSubmissionsForLeaderboard,
} from "@/lib/Prismafnctns";
import { useAccount } from "wagmi";

const TaskDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const [task, setTask] = useState<TaskWithEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "subtasks"
  >("overview");
  const [expandedSubtask, setExpandedSubtask] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isStartingTask, setIsStartingTask] = useState(false);
  const [showSelfModal, setShowSelfModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [taskStarted, setTaskStarted] = useState(false);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [leaderboardSubmissions, setLeaderboardSubmissions] = useState<any[]>(
    []
  );
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const taskId = params.id as string;

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const taskData = await getTaskById(parseInt(taskId));
        if (taskData) {
          setTask(taskData);

          // Check if user has already submitted to this task
          if (address) {
            setCheckingSubmission(true);
            try {
              const submission = await hasUserSubmittedToTask(
                address,
                taskData.id
              );
              if (submission) {
                setUserSubmission(submission);
              }
            } catch (err) {
              console.error("Error checking submission:", err);
            } finally {
              setCheckingSubmission(false);
            }
          }

          // Fetch leaderboard data
          setLoadingLeaderboard(true);
          try {
            const submissions = await getTaskSubmissionsForLeaderboard(
              taskData.id
            );
            setLeaderboardSubmissions(submissions);
          } catch (err) {
            console.error("Error loading leaderboard:", err);
          } finally {
            setLoadingLeaderboard(false);
          }
        } else {
          setError("Task not found");
        }
      } catch (err) {
        setError("Failed to load task");
        console.error("Error loading task:", err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }
  }, [taskId, address]);

  const handleStartTask = async () => {
    if (!task) return;

    // Check if task has actual requirements and user is not verified
    const hasRequirements =
      task.restrictionsEnabled &&
      ((task.ageRestriction && (task.minAge || task.maxAge)) ||
        task.genderRestriction ||
        (task.countryRestriction && task.countries));

    if (hasRequirements && !isVerified) {
      setShowSelfModal(true);
      return;
    }

    // No requirements or already verified - proceed to task
    setIsStartingTask(true);
    try {
      // Simulate task start process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Set task as started and show form
      setIsStartingTask(false);
      setTaskStarted(true);
    } catch (error) {
      alert("Failed to start task. Please try again.");
      setIsStartingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-celo-lt-tan">
        {/* Header Skeleton */}
        <div className="relative bg-celo-yellow border-b-4 border-black sticky top-0 z-50">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-black animate-pulse"></div>
                  <div className="h-4 w-32 bg-black animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative px-4 py-6 pb-24 space-y-6">
          {/* Hero Card Skeleton */}
          <div className="bg-white border-4 border-black p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-16 h-16 bg-celo-purple animate-pulse"></div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-8 w-3/4 bg-black animate-pulse"></div>
                  <div className="h-5 w-24 bg-black animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Reward and Status Skeleton */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-40 bg-celo-yellow animate-pulse"></div>
              <div className="h-8 w-20 bg-celo-forest animate-pulse"></div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="h-5 w-full bg-black animate-pulse"></div>
              <div className="h-5 w-5/6 bg-black animate-pulse"></div>
              <div className="h-5 w-4/5 bg-black animate-pulse"></div>
            </div>

            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-celo-lt-tan border-4 border-black p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 bg-black animate-pulse"></div>
                  <div className="h-4 w-24 bg-black animate-pulse"></div>
                </div>
                <div className="h-8 w-20 bg-black animate-pulse"></div>
              </div>

              <div className="bg-celo-lt-tan border-4 border-black p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 bg-black animate-pulse"></div>
                  <div className="h-4 w-20 bg-black animate-pulse"></div>
                </div>
                <div className="h-8 w-24 bg-black animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Action Button Skeleton */}
          <div className="w-full h-14 bg-celo-yellow border-4 border-black animate-pulse"></div>

          {/* Verification Status Skeleton */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-celo-forest animate-pulse"></div>
              <div className="h-4 w-32 bg-celo-forest animate-pulse"></div>
            </div>
          </div>

          {/* Tab Navigation Skeleton */}
          <div className="bg-white border-4 border-black p-1">
            <div className="flex">
              <div className="flex-1 h-12 bg-celo-yellow animate-pulse mx-1"></div>
              <div className="flex-1 h-12 bg-celo-purple animate-pulse mx-1"></div>
              <div className="flex-1 h-12 bg-celo-forest animate-pulse mx-1"></div>
            </div>
          </div>

          {/* Tab Content Skeleton */}
          <div className="space-y-4">
            {/* Creator Card Skeleton */}
            <div className="bg-white border-4 border-black p-5">
              <div className="flex items-center mb-4">
                <div className="w-5 h-5 bg-celo-purple rounded mr-2 animate-pulse"></div>
                <div className="h-6 w-16 bg-black animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-celo-purple rounded-full animate-pulse"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-5 w-32 bg-black animate-pulse"></div>
                  <div className="h-4 w-24 bg-black animate-pulse"></div>
                </div>
                <div className="h-6 w-16 bg-celo-forest rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Requirements Card Skeleton */}
            <div className="bg-white border-4 border-black p-5">
              <div className="flex items-center mb-4">
                <div className="w-5 h-5 bg-celo-orange rounded mr-2 animate-pulse"></div>
                <div className="h-6 w-24 bg-black animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-celo-lt-tan border-2 border-black">
                  <div className="w-4 h-4 bg-black animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-3 w-20 bg-black animate-pulse"></div>
                    <div className="h-4 w-24 bg-black animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-celo-lt-tan border-2 border-black">
                  <div className="w-4 h-4 bg-black animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-black animate-pulse"></div>
                    <div className="h-4 w-20 bg-black animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Cards Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-celo-yellow border-4 border-black p-5 text-center">
                <div className="w-8 h-8 bg-black rounded mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-20 bg-black rounded mx-auto mb-1 animate-pulse"></div>
                <div className="h-6 w-24 bg-black rounded mx-auto animate-pulse"></div>
              </div>
              <div className="bg-celo-purple border-4 border-black p-5 text-center">
                <div className="w-8 h-8 bg-white rounded mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 w-16 bg-white rounded mx-auto mb-1 animate-pulse"></div>
                <div className="h-6 w-20 bg-white rounded mx-auto animate-pulse"></div>
              </div>
            </div>

            {/* Timeline Skeleton */}
            <div className="bg-white border-4 border-black p-5">
              <div className="flex items-center mb-4">
                <div className="w-5 h-5 bg-celo-purple rounded mr-2 animate-pulse"></div>
                <div className="h-6 w-20 bg-black animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-celo-lt-tan border-2 border-black">
                  <div className="h-4 w-16 bg-black animate-pulse"></div>
                  <div className="h-4 w-24 bg-black animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-celo-lt-tan border-2 border-black">
                  <div className="h-4 w-12 bg-black animate-pulse"></div>
                  <div className="h-4 w-20 bg-black animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white border-4 border-black px-6 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-6 h-6 border-2 border-celo-purple rounded-full animate-spin"></div>
                <div className="w-4 h-4 border-2 border-celo-forest border-t-transparent rounded-full animate-spin absolute top-1 left-1"></div>
              </div>
              <div className="text-black text-sm font-inter font-heavy">
                LOADING TASK DETAILS...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-celo-lt-tan flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-celo-error flex items-center justify-center mx-auto mb-6 border-4 border-black">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-h2 font-gt-alpina font-thin text-black mb-3 tracking-tight">
            TASK NOT FOUND
          </h2>
          <p className="text-body-m font-inter text-black/70 mb-8 leading-relaxed">
            {error || "The task you are looking for does not exist."}
          </p>
          <button
            onClick={() => router.back()}
            className="bg-celo-yellow text-black px-8 py-3 hover:bg-black hover:text-celo-yellow transition-all duration-300 font-inter font-heavy border-4 border-black"
          >
            GO BACK
          </button>
        </div>
      </div>
    );
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-celo-forest text-white";
      case "PAUSED":
        return "bg-celo-orange text-black";
      case "COMPLETED":
        return "bg-celo-purple text-white";
      default:
        return "bg-celo-dk-tan text-black";
    }
  };



  const getSubtaskTypeIcon = (type: string) => {
    switch (type) {
      case "TEXT_INPUT":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "MULTIPLE_CHOICE":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "FILE_UPLOAD":
        return <Target className="w-4 h-4 text-purple-500" />;
      case "RATING":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "SURVEY":
        return <Users className="w-4 h-4 text-indigo-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const handleVerificationSuccess = () => {
    setIsVerified(true);
    setShowSelfModal(false);
    // Now user can start the task
    handleStartTask();
  };

  const handleVerificationClose = () => {
    setShowSelfModal(false);
  };

  const handleTaskComplete = (submission: any) => {
    console.log("Task completed:", submission);
    // Here you would typically:
    // 1. Save submission to database
    // 2. Update user progress
    // 3. Handle reward distribution

    // For now, show success message
    alert(
      `Task completed successfully! Your score: ${submission.totalScore}/10`
    );

    setTimeout(() => {
      // Reset task state
      setTaskStarted(false);
      setIsVerified(false);
    }, 3000);
  };

  // Check if task has actual requirements
  const hasRequirements =
    task?.restrictionsEnabled &&
    ((task.ageRestriction && (task.minAge || task.maxAge)) ||
      task.genderRestriction ||
      (task.countryRestriction && task.countries));

  return (
    <div className="min-h-screen bg-celo-lt-tan relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-celo-yellow/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-celo-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-celo-forest/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="bg-celo-yellow border-b-4 border-black rounded-b-3xl sticky top-0 z-50 shadow-[0_6px_0_0_rgba(0,0,0,1)]">
        <div className="px-6 py-5 flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 border-2 border-black bg-white rounded-lg hover:bg-black hover:text-celo-yellow transition-all duration-300 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-h4 font-gt-alpina font-bold text-black truncate tracking-tight">
              {task.title}
            </h1>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-celo-success rounded-full animate-pulse"></span>
              <p className="text-eyebrow font-inter text-black/70 uppercase tracking-widest">
                Agent Powered Task
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative px-4 py-6 pb-24 space-y-6">
        {/* Show FormGenerator if task is started */}
        {taskStarted ? (
          <FormGenerator
            task={task}
            onTaskCompleted={() => {
              // Refresh leaderboard data after task completion
              setLoadingLeaderboard(true);
              getTaskSubmissionsForLeaderboard(task.id)
                .then((submissions) => {
                  setLeaderboardSubmissions(submissions);
                  setLoadingLeaderboard(false);
                })
                .catch((err) => {
                  console.error("Error refreshing leaderboard:", err);
                  setLoadingLeaderboard(false);
                });
            }}
            closeFormGenerator={() => {
              setTaskStarted(false);
            }}
          />
        ) : (
          <>
            {/* Hero Card */}
            <div className="bg-white border-4 border-black p-6">
              <div className="flex items-center justify-end mb-2">
                <div
                  className={`px-3 py-1 text-eyebrow font-inter font-heavy border-2 border-black ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status}
                </div>
              </div>
              <div className="flex items-start justify-between mb-4">

                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-h4 font-gt-alpina font-bold text-black mb-1 leading-tight tracking-tight">
                      {task.title}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Reward and Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-h2 font-gt-alpina font-thin text-celo-success tracking-tight">
                    {Number(task.baseReward) / Math.pow(10, 6)} USDC
                  </div>
                </div>

              </div>

              <p className="text-body-s font-inter text-black/70 mb-6 leading-relaxed">
                {task.description}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-celo-lt-tan border-4 border-black p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-celo-purple text-eyebrow font-inter font-heavy">
                      PARTICIPANTS
                    </span>
                  </div>
                  <div className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                    {task.currentParticipants}/{task.maxParticipants}
                  </div>
                </div>

                <div className="bg-celo-lt-tan border-4 border-black p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-celo-purple" />
                    <span className="text-celo-purple text-eyebrow font-inter font-heavy">
                      TIME LEFT
                    </span>
                  </div>
                  <div className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                    {task.expiresAt
                      ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(task.expiresAt).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                        )
                      )
                      : "∞"}{" "}
                    days
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {userSubmission ? (
              <div className="w-full bg-celo-forest border-4 border-black p-6 text-center">
                <div className="w-16 h-16 bg-celo-yellow flex items-center justify-center mx-auto mb-4 border-2 border-black">
                  <CheckCircle className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-h3 font-gt-alpina font-thin text-white mb-2 tracking-tight">
                  TASK COMPLETED! 🎉
                </h3>
                <p className="text-body-s font-inter text-white/90 mb-4">
                  You&apos;ve already completed this task
                </p>
                <div className="bg-white border-4 border-black p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-body-s">
                    <div>
                      <span className="text-celo-forest font-inter font-heavy">
                        AI RATING:
                      </span>
                      <div className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                        {userSubmission.aiRating}/10
                      </div>
                    </div>
                    <div>
                      <span className="text-celo-forest font-inter font-heavy">
                        REWARD EARNED:
                      </span>
                      <div className="text-h4 font-gt-alpina font-thin text-black tracking-tight">
                        {Number(userSubmission.reward).toFixed(4)} USDC
                      </div>
                    </div>
                  </div>
                  {userSubmission.aiFeedback && (
                    <div className="mt-3 text-left">
                      <span className="text-celo-forest font-inter font-heavy text-body-s">
                        AI FEEDBACK:
                      </span>
                      <p className="text-black/70 font-inter text-body-s mt-1">
                        {userSubmission.aiFeedback}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab("subtasks")}
                  className="px-6 py-2 bg-celo-yellow text-black hover:bg-black hover:text-celo-yellow transition-colors text-body-s font-inter font-heavy border-2 border-black"
                >
                  VIEW YOUR RESPONSES
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartTask}
                disabled={isStartingTask}
                className={`w-full font-inter font-heavy py-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:scale-100 flex items-center justify-center space-x-2 border-4 border-black text-body-l ${isVerified
                  ? "bg-celo-forest text-white hover:bg-black hover:text-celo-forest"
                  : hasRequirements
                    ? "bg-celo-orange text-black hover:bg-black hover:text-celo-orange"
                    : "bg-celo-yellow text-black hover:bg-black hover:text-celo-yellow"
                  }`}
              >
                {isStartingTask ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin"></div>
                    <span>STARTING TASK...</span>
                  </>
                ) : isVerified ? (
                  <>
                    <Play className="w-5 h-5" />
                    <span>START TASK</span>
                  </>
                ) : hasRequirements ? (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>VERIFY IDENTITY TO START</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>START TASK</span>
                  </>
                )}
              </button>
            )}

            {/* Verification Status */}
            {userSubmission ? (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-celo-forest text-body-s font-inter font-heavy">
                  <CheckCircle className="w-4 h-4" />
                  <span>TASK COMPLETED SUCCESSFULLY ✓</span>
                </div>
              </div>
            ) : (
              hasRequirements && (
                <div className="text-center">
                  {isVerified ? (
                    <div className="flex items-center justify-center space-x-2 text-celo-forest text-body-s font-inter font-heavy">
                      <CheckCircle className="w-4 h-4" />
                      <span>IDENTITY VERIFIED ✓</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-celo-orange text-body-s font-inter font-heavy">
                      <AlertCircle className="w-4 h-4" />
                      <span>IDENTITY VERIFICATION REQUIRED</span>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Tab Navigation */}
            <div className="bg-white border-4 border-black p-1">
              <div className="flex">
                {[
                  {
                    key: "overview",
                    label: "OVERVIEW",
                    icon: Eye,
                    color: "bg-celo-forest",
                  },
                  {
                    key: "subtasks",
                    label: "TASKS",
                    icon: Target,
                    color: "bg-celo-forest",
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-3 text-body-s font-inter font-heavy transition-all duration-300 border-2 border-black ${activeTab === tab.key
                      ? `${tab.color} text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]`
                      : "bg-white text-black hover:bg-celo-dk-tan"
                      }`}
                  >
                    {/* <tab.icon className="w-4 h-4" /> */}
                    <span className="inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-4">

                {/* Requirements */}
                {task.restrictionsEnabled && (
                  <div className="bg-white border-4 border-black p-5">
                    <h3 className="text-h4 font-gt-alpina font-thin text-black mb-4 flex items-center">
                      <Shield className="w-5 h-5 text-celo-orange mr-2" />
                      REQUIREMENTS
                    </h3>
                    <div className="space-y-3">
                      {task.ageRestriction && (task.minAge || task.maxAge) && (
                        <div className="flex items-center space-x-3 p-3 bg-celo-lt-tan border-2 border-black">
                          <CalendarDays className="w-4 h-4 text-celo-orange flex-shrink-0" />
                          <div>
                            <div className="text-body-s text-celo-orange font-inter font-heavy">
                              AGE RANGE
                            </div>
                            <div className="text-black font-inter font-heavy">
                              {task.minAge || 0} - {task.maxAge || "∞"} years
                            </div>
                          </div>
                        </div>
                      )}
                      {task.countryRestriction && task.countries && (
                        <div className="flex items-center space-x-3 p-3 bg-celo-lt-tan border-2 border-black">
                          <MapPin className="w-4 h-4 text-celo-blue flex-shrink-0" />
                          <div>
                            <div className="text-body-s text-celo-blue font-inter font-heavy">
                              COUNTRIES
                            </div>
                            <div className="text-black font-inter font-heavy">
                              {task.countries}
                            </div>
                          </div>
                        </div>
                      )}
                      {task.genderRestriction && task.gender && (
                        <div className="flex items-center space-x-3 p-3 bg-celo-lt-tan border-2 border-black">
                          <AwardIcon className="w-4 h-4 text-celo-purple flex-shrink-0" />
                          <div>
                            <div className="text-body-s text-celo-purple font-inter font-heavy">
                              GENDER REQUIRED
                            </div>
                            <div className="text-black font-inter font-heavy">
                              {task.gender === "M" ? "Male" : "Female"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-white border-4 border-black p-5">
                  <h3 className="text-h4 font-gt-alpina font-thin text-black mb-4 flex items-center">
                    <Clock className="w-5 h-5 text-celo-purple mr-2" />
                    TIMELINE
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-celo-lt-tan border-2 border-black">
                      <span className="text-celo-purple text-body-s font-inter font-heavy">
                        CREATED
                      </span>
                      <span className="font-inter font-heavy text-black text-body-s">
                        {task.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-celo-lt-tan border-2 border-black">
                      <span className="text-celo-error text-body-s font-inter font-heavy">
                        EXPIRES
                      </span>
                      <span className="font-inter font-heavy text-celo-error text-body-s">
                        {task.expiresAt
                          ? task.expiresAt.toLocaleDateString()
                          : "No expiry"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "subtasks" && (
              <div className="bg-white border-4 border-black p-5">
                <h3 className="text-h5 font-gt-alpina font-heavy text-black mb-6 flex items-center">
                  {userSubmission ? "YOUR COMPLETED SUBTASKS" : "SUBTASKS"} (
                  {task.subtasks.length})
                </h3>

                {userSubmission ? (
                  <div className="space-y-4">
                    {/* User's responses */}
                    <div className="space-y-3">
                      {userSubmission.responses.map(
                        (response: any, index: number) => {
                          const subtask = task.subtasks.find(
                            (s) => s.id === response.subtaskId
                          );
                          if (!subtask) return null;

                          return (
                            <div
                              key={response.id}
                              className="bg-celo-lime border-4 border-black overflow-hidden"
                            >
                              <div className="p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 bg-celo-forest border-2 border-black flex items-center justify-center text-white text-sm font-inter font-heavy flex-shrink-0">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-inter font-heavy text-black">
                                      {subtask.title}
                                    </h4>
                                    <p className="text-celo-body text-body-s font-inter">
                                      {subtask.description}
                                    </p>
                                  </div>
                                  <CheckCircle className="w-6 h-6 text-celo-forest" />
                                </div>

                                <div className="bg-white border-2 border-black p-3">
                                  <div className="text-body-s text-celo-body mb-2 font-inter font-heavy">
                                    YOUR RESPONSE:
                                  </div>
                                  <div className="text-black font-inter font-heavy">
                                    {subtask.type === "MULTIPLE_CHOICE"
                                      ? JSON.parse(response.response).join(", ")
                                      : response.response}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {task.subtasks.map((subtask, index) => (
                      <div
                        key={subtask.id}
                        className="bg-celo-lt-tan border-4 border-black overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedSubtask(
                              expandedSubtask === subtask.id ? null : subtask.id
                            )
                          }
                          className="w-full p-4 flex items-center space-x-3 hover:bg-celo-dk-tan transition-colors"
                        >
                          <div className="w-8 h-8 bg-celo-purple border-2 border-black flex items-center justify-center text-white text-sm font-inter font-heavy flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-inter font-heavy text-black truncate">
                                {subtask.title}
                              </h4>
                              {subtask.required && (
                                <span className="bg-celo-error text-white px-2 py-1 border-2 border-black text-eyebrow font-inter font-heavy">
                                  REQUIRED
                                </span>
                              )}
                            </div>
                            <p className="text-celo-body text-body-s font-inter truncate">
                              {subtask.description}
                            </p>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-black transform transition-transform ${expandedSubtask === subtask.id ? "rotate-180" : ""
                              }`}
                          />
                        </button>

                        {expandedSubtask === subtask.id && (
                          <div className="px-4 pb-4 border-t-2 border-black bg-white">
                            <div className="pt-4 space-y-2">
                              <p className="text-black text-body-s font-inter leading-relaxed">
                                {subtask.description}
                              </p>

                              {subtask.placeholder && (
                                <div className="text-body-s text-celo-body">
                                  <span className="font-inter font-heavy">
                                    PLACEHOLDER:
                                  </span>{" "}
                                  {subtask.placeholder}
                                </div>
                              )}
                              {subtask.maxLength && (
                                <div className="text-body-s text-celo-body">
                                  <span className="font-inter font-heavy">
                                    MAX LENGTH:
                                  </span>{" "}
                                  {subtask.maxLength} characters
                                </div>
                              )}
                              <div className="text-body-s text-celo-body">
                                <span className="font-inter font-heavy">
                                  FILE TYPES:
                                </span>{" "}
                                All types accepted
                              </div>
                              {subtask.options && (
                                <div className="text-body-s text-celo-body">
                                  <span className="font-inter font-heavy">
                                    OPTIONS:
                                  </span>{" "}
                                  {subtask.options}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Removed Leaderboard section */}
          </>
        )}
      </div>

      {/* Self Protocol Verification Modal */}
      {
        showSelfModal && task && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="animate-in fade-in-0 zoom-in-95 duration-200">
              <React.Suspense
                fallback={
                  <div className="bg-white rounded-2xl p-6 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading verification...</p>
                  </div>
                }
              >
                <SelfModal
                  requirements={{
                    age:
                      task.ageRestriction && task.minAge && task.maxAge
                        ? { min: task.minAge, max: task.maxAge }
                        : undefined,
                    gender:
                      task.genderRestriction && task.gender
                        ? task.gender
                        : undefined,
                    countries:
                      task.countryRestriction && task.countries
                        ? [task.countries]
                        : undefined,
                  }}
                  onVerificationSuccess={handleVerificationSuccess}
                  onClose={handleVerificationClose}
                />
              </React.Suspense>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default TaskDetailPage;
