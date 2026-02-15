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
  Eye,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Star,
  Shield,
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
  Pause,
  Trash2,
  Edit,
  MessageSquare,
  Download,
  Eye as EyeIcon,
} from "lucide-react";
import {
  dbDeleteTask,
  getTaskDetails,
  updateTaskStatus,
} from "@/lib/Prismafnctns";
import { getTask } from "@/lib/ReadFunctions";
import BottomNavigation from "@/components/BottomNavigation";
import { toast } from "sonner";
import { useAccount, useWriteContract } from "wagmi";
import {
  contractAbi,
  contractAddress,
  cUSDAddress,
} from "@/contexts/constants";
import { erc20Abi, parseEther } from "viem";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { celo } from "wagmi/chains";
import { wagmiConfig } from "@/providers/AppProvider";
import { TaskStatus } from "@prisma/client";
import { getBalances } from "@/lib/Balance";

interface TaskResponse {
  id: number;
  userName: string;
  walletAddress: string;
  submittedAt: Date;
  responses: {
    subtaskId: number;
    response: string;
    type: string;
  }[];
  status: string;
}

interface TaskWithBlockchainData {
  id: number;
  title: string;
  blockChainId: string;
  description: string;
  status: string;
  totalAmount: bigint;
  paidAmount: bigint;
  currentAmount: bigint;
  maxParticipants: number;
  currentParticipants: number;
  createdAt: Date;
  expiresAt: Date | null;
  responses: TaskResponse[];
}

const MyTaskDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<TaskWithBlockchainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "responses" | "analytics"
  >("overview");
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const taskId = params.id as string;
  const { isConnected, address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  // Responses will be loaded from database
  const [responses, setResponses] = useState<TaskResponse[]>([]);
  const [expandedResponses, setExpandedResponses] = useState<number[]>([]);
  const [balances, setBalances] = useState<{ cUSDBalance: string, USDCBalance: string, celoBalance: string } | null>(null);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Get task data from Prisma
        const taskData = await getTaskDetails(parseInt(taskId));
        if (taskData) {
          // Get blockchain data
          const blockchainTask = await getTask(BigInt(taskData.blockChainId));

          const taskWithBlockchain: TaskWithBlockchainData = {
            id: taskData.id,
            title: taskData.title,
            description: taskData.description,
            blockChainId: taskData.blockChainId,
            status: taskData.status,
            totalAmount: blockchainTask.totalAmount,
            paidAmount: blockchainTask.paidAmount,
            currentAmount:
              blockchainTask.totalAmount - blockchainTask.paidAmount,
            maxParticipants: taskData.maxParticipants,
            currentParticipants: taskData.currentParticipants,
            createdAt: taskData.createdAt,
            expiresAt: taskData.expiresAt,
            responses: [], // Will be populated from Prisma submissions
          };

          setTask(taskWithBlockchain);

          // Load responses from database
          if (taskData.submissions && taskData.submissions.length > 0) {
            const dbResponses: TaskResponse[] = taskData.submissions.map(
              (submission) => ({
                id: submission.id,
                userName: submission.user.userName,
                walletAddress: submission.user.walletAddress,
                submittedAt: submission.submittedAt,
                status: submission.status,
                responses:
                  submission.responses?.map((response) => ({
                    subtaskId: response.subtaskId,
                    response: response.response,
                    type: response.subtask?.type || "UNKNOWN",
                  })) || [],
              })
            );
            setResponses(dbResponses);
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
  }, [taskId]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (isConnected && address) {
        const balances = await getBalances(address as `0x${string}`);
        setBalances({
          cUSDBalance: (Number(balances.cUSDBalance) / 1e18).toFixed(3),
          USDCBalance: (Number(balances.USDCBalance) / 1e18).toFixed(3),
          celoBalance: (Number(balances.celoBalance) / 1e18).toFixed(3),
        });
      }
    };
    fetchBalances();
  }, [isConnected, address]);

  const handleAddFunds = async () => {
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) return;
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsDepositing(true);
    try {
      // approve function
      const amountInWei = parseEther(addFundsAmount);
      const taskIdInBigInt = BigInt(task?.blockChainId || 0);
      // 1. Approve allowance
      const approveTx = await writeContractAsync({
        address: cUSDAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, amountInWei],
      });

      // Wait for confirmation
      await waitForTransactionReceipt(wagmiConfig, {
        chainId: celo.id,
        hash: approveTx,
        pollingInterval: 3000, // 3s
      });

      let allowance = 0n;
      for (let i = 0; i < 5; i++) {
        allowance = await readContract(wagmiConfig, {
          address: cUSDAddress,
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

      // 2. Call addFundsForTask
      const addFundsTx = await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: "depositForTask",
        args: [taskIdInBigInt, amountInWei],
      });
      if (!addFundsTx) {
        toast.error("Failed to add funds");
        return;
      }
      toast.success(`${addFundsAmount} cUSD added to the task`);
      // Update task budget (in real app, this would update blockchain)
      if (task) {
        setTask({
          ...task,
          totalAmount:
            task.totalAmount +
            BigInt(parseFloat(addFundsAmount) * Math.pow(10, 18)),
          currentAmount:
            task.currentAmount +
            BigInt(parseFloat(addFundsAmount) * Math.pow(10, 18)),
        });
      }

      setShowAddFundsModal(false);
      setAddFundsAmount("");
    } catch (error) {
      console.error("Error adding funds:", error);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleDeactivateTask = async (taskStatus: TaskStatus) => {
    if (!task) return;

    setIsPausing(true);
    try {
      await updateTaskStatus(task.id, taskStatus);
      // Reflect status locally
      setTask((prev) => (prev ? { ...prev, status: taskStatus } : prev));
      if (taskStatus === "PAUSED") {
        toast.success(
          "Task paused successfully. It will not be shown to users."
        );
      } else {
        toast.success(
          "Task activated successfully. It will be shown to users."
        );
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setIsPausing(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsDeleting(true);
    try {
      // delete task from blockchain
      const deleteTx = await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: "closeTask",
        args: [BigInt(task.blockChainId)],
      });
      if (!deleteTx) {
        toast.error("Failed to delete task");
        return;
      }

      // delete task from database
      const deleted = await dbDeleteTask(task.id);
      if (!deleted) {
        toast.error("Failed to delete task from database");
        return;
      }

      toast.success(`Task deleted successfully. Remaining balance: ${Number(task.currentAmount) / 1e18} cUSD has been returned to your wallet.`);

      // Navigate back to myTasks
      router.push("/myTasks");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-celo-lt-tan">
        {/* Header Skeleton */}
        <div className="bg-celo-yellow border-b-4 rounded-b-2xl border-black sticky top-0 z-50">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-black animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-black animate-pulse"></div>
                  <div className="h-4 w-24 bg-black animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative px-6 py-8 pb-24 space-y-8">
          {/* Action Buttons Skeleton */}
          <div className="flex flex-wrap gap-4">
            <div className="h-14 w-40 bg-celo-forest animate-pulse"></div>
            <div className="h-14 w-44 bg-celo-purple animate-pulse"></div>
          </div>

          {/* Tab Navigation Skeleton */}
          <div className="bg-white border-4 border-black">
            <div className="flex">
              <div className="flex-1 h-16 bg-celo-yellow animate-pulse border-r-4 border-black"></div>
              <div className="flex-1 h-16 bg-celo-dk-tan animate-pulse"></div>
            </div>
          </div>

          {/* Hero Card Skeleton */}
          <div className="bg-white border-4 border-black p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-16 h-16 bg-celo-purple animate-pulse"></div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-8 w-3/4 bg-black animate-pulse"></div>
                  <div className="h-5 w-24 bg-black animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Reward and Status Skeleton */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-10 w-40 bg-celo-yellow animate-pulse"></div>
              <div className="h-8 w-20 bg-celo-forest animate-pulse"></div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="h-5 w-full bg-black animate-pulse"></div>
              <div className="h-5 w-5/6 bg-black animate-pulse"></div>
              <div className="h-5 w-4/5 bg-black animate-pulse"></div>
            </div>

            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-celo-dk-tan border-2 border-black p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-5 h-5 bg-black animate-pulse"></div>
                  <div className="h-4 w-24 bg-black animate-pulse"></div>
                </div>
                <div className="h-8 w-20 bg-black animate-pulse"></div>
              </div>

              <div className="bg-celo-dk-tan border-2 border-black p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-5 h-5 bg-black animate-pulse"></div>
                  <div className="h-4 w-20 bg-black animate-pulse"></div>
                </div>
                <div className="h-8 w-24 bg-black animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Budget Cards Skeleton */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-celo-yellow border-4 border-black p-6 text-center">
              <div className="w-10 h-10 bg-black mx-auto mb-4 animate-pulse"></div>
              <div className="h-5 w-24 bg-black mx-auto mb-2 animate-pulse"></div>
              <div className="h-8 w-32 bg-black mx-auto animate-pulse"></div>
            </div>
            <div className="bg-celo-purple border-4 border-black p-6 text-center">
              <div className="w-10 h-10 bg-white mx-auto mb-4 animate-pulse"></div>
              <div className="h-5 w-28 bg-white mx-auto mb-2 animate-pulse"></div>
              <div className="h-8 w-28 bg-white mx-auto animate-pulse"></div>
            </div>
          </div>

          {/* Timeline Skeleton */}
          <div className="bg-white border-4 border-black p-6">
            <div className="flex items-center mb-6">
              <div className="w-6 h-6 bg-black mr-3 animate-pulse"></div>
              <div className="h-8 w-24 bg-black animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-celo-dk-tan border-2 border-black">
                <div className="h-5 w-20 bg-black animate-pulse"></div>
                <div className="h-5 w-32 bg-black animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between p-4 bg-celo-dk-tan border-2 border-black">
                <div className="h-5 w-16 bg-black animate-pulse"></div>
                <div className="h-5 w-28 bg-black animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Delete Button Skeleton */}
          <div className="flex justify-end">
            <div className="h-14 w-40 bg-celo-error animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-celo-lt-tan flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-celo-error border-4 border-black flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-h3 font-gt-alpina font-thin text-black mb-4">
            TASK NOT FOUND
          </h2>
          <p className="text-body-m text-celo-body mb-12">
            {error || "The task you are looking for does not exist."}
          </p>
          <button
            onClick={() => router.back()}
            className="bg-celo-yellow text-black px-12 py-4 border-4 border-black hover:bg-black hover:text-celo-yellow transition-all duration-200 font-inter font-heavy text-body-m"
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
        return "bg-celo-success text-white border-2 border-black";
      case "PAUSED":
        return "bg-celo-orange text-black border-2 border-black";
      case "COMPLETED":
        return "bg-celo-blue text-black border-2 border-black";
      default:
        return "bg-celo-inactive text-white border-2 border-black";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Hard":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const toggleResponseDropdown = (responseId: number) => {
    setExpandedResponses((prev) =>
      prev.includes(responseId)
        ? prev.filter((id) => id !== responseId)
        : [...prev, responseId]
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "No date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getResponseStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-celo-success text-white border-2 border-black";
      case "PENDING":
        return "bg-celo-orange text-black border-2 border-black";
      case "REJECTED":
        return "bg-celo-error text-white border-2 border-black";
      default:
        return "bg-celo-inactive text-white border-2 border-black";
    }
  };

  return (
    <div className="min-h-screen bg-celo-lt-tan font-inter">
      {/* Header */}
      <header className="bg-celo-yellow border-b-4 border-black rounded-b-3xl sticky top-0 z-50 shadow-[0_6px_0_0_rgba(0,0,0,1)]">
        <div className="px-6 py-5 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 border-2 border-black bg-white rounded-lg hover:bg-black hover:text-celo-yellow transition-all duration-300 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-h5 font-gt-alpina font-bold text-black text-center truncate px-4">
            {task.title}
          </h1>
          <div className="w-10" /> {/* spacing balance */}
        </div>
      </header>

      <main className="relative px-6 py-8 pb-24 space-y-8">
        {/* Paused Warning */}
        {task.status === "PAUSED" && (
          <div className="bg-celo-orange border-2 border-black p-4 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-black mt-0.5" />
              <div>
                <p className="text-body-m font-inter font-heavy text-black uppercase">Task is Paused</p>
                <p className="text-body-s text-black/80 font-inter">While paused, this task will not appear to users.</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setShowAddFundsModal(true)}
            className="flex items-center gap-3 px-6 py-4 bg-celo-forest text-white border-4 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-celo-forest transition-all duration-300 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>ADD FUNDS</span>
          </button>

          <button
            onClick={() => handleDeactivateTask(task.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
            disabled={isPausing}
            className={`flex items-center gap-3 px-6 py-4 border-4 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all duration-300 active:scale-95 font-heavy ${task.status === "ACTIVE"
                ? "bg-celo-orange text-black hover:bg-black hover:text-celo-orange"
                : "bg-celo-success text-white hover:bg-black hover:text-celo-success"
              }`}
          >
            {isPausing ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin"></div>
            ) : task.status === "ACTIVE" ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>
              {task.status === "ACTIVE" ? "PAUSE TASK" : "ACTIVATE TASK"}
            </span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex border-4 border-black bg-white rounded-2xl overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            {[
              { key: "overview", label: "OVERVIEW", icon: Eye },
              {
                key: "responses",
                label: `RESPONSES (${responses.length})`,
                icon: MessageSquare,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 font-heavy text-body-m transition-all duration-300 ${activeTab === tab.key
                    ? "bg-celo-yellow text-black"
                    : "bg-transparent hover:bg-celo-dk-tan hover:text-black"
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Section */}
        {activeTab === "overview" && (
          <section className="space-y-8">
            {/* Hero Card */}
            <div className="bg-white border-4 border-black p-8 rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-4 bg-celo-purple border-2 border-black rounded-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-h5 font-gt-alpina font-bold text-black mb-2">
                      {task.title}
                    </h2>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 border-2 border-black font-heavy text-body-s uppercase ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status}
                </div>
              </div>

              <p className="text-body-m text-celo-body leading-relaxed mb-8">
                {task.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-celo-dk-tan border-2 border-black p-2 rounded-xl  text-center">
                  <Users className="w-6 h-6 mx-auto text-black mb-2" />
                  <p className="font-heavy text-body-s text-black">
                    PARTICIPANTS
                  </p>
                  <p className="text-h3 font-gt-alpina text-black">
                    {task.currentParticipants}/{task.maxParticipants}
                  </p>
                </div>
                <div className="bg-celo-dk-tan border-2 border-black p-2 rounded-xl text-center">
                  <Clock className="w-6 h-6 mx-auto text-black mb-2" />
                  <p className="font-heavy text-body-s text-black">TIME LEFT</p>
                  <p className="text-h5 font-bold font-gt-alpina text-black">
                    {task.expiresAt
                      ? `${Math.ceil(
                        (task.expiresAt.getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                      )} days`
                      : "No deadline"}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-celo-yellow border-4 border-black p-6 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-center">
                <Coins className="w-10 h-10 mx-auto mb-3 text-black" />
                <p className="font-heavy text-black mb-1">TOTAL SPENT</p>
                <p className="text-h3 font-gt-alpina text-black">
                  {(Number(task.paidAmount) / 1e18).toFixed(3)} cUSD
                </p>
              </div>
              <div className="bg-celo-purple border-4 border-black p-6 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-center">
                <DollarSign className="w-10 h-10 mx-auto mb-3 text-white" />
                <p className="font-heavy text-white mb-1">CURRENT BALANCE</p>
                <p className="text-h3 font-gt-alpina text-white">
                  {Number(task.currentAmount) / 1e18 > 0
                    ? (Number(task.currentAmount) / 1e18).toFixed(3)
                    : "0"}{" "}
                  cUSD
                </p>
              </div>
            </div>
            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-3 px-6 py-4 bg-celo-error text-white border-4 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-celo-error transition-all duration-300 active:scale-95 font-heavy"
            >
              <Trash2 className="w-5 h-5" />
              <span>DELETE TASK</span>
            </button>
          </section>
        )}

        {/* Responses Section */}
        {activeTab === "responses" && (
          <section className="space-y-6">
            {responses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-celo-dk-tan border-4 border-black flex items-center justify-center rounded-xl mx-auto mb-8">
                  <MessageSquare className="w-16 h-16 text-black" />
                </div>
                <h3 className="text-h3 font-gt-alpina text-black mb-4">
                  NO RESPONSES YET
                </h3>
                <p className="text-body-m text-celo-body font-inter">
                  Participants will appear here once they submit responses.
                </p>
              </div>
            ) : (
              responses.map((response) => (
                <div
                  key={response.id}
                  className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                >
                  {/* Response Header - Clickable Dropdown */}
                  <button
                    onClick={() => toggleResponseDropdown(response.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-celo-dk-tan transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-16 bg-celo-purple border-2 border-black rounded-lg flex items-center justify-center">
                        <span className="text-white font-gt-alpina text-h5">
                          {response.userName.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-h5 font-gt-alpina text-black">
                          {response.userName}
                        </h4>
                        <p className="text-body-s text-celo-body font-mono">
                          {response.walletAddress.slice(0, 6)}...
                          {response.walletAddress.slice(-4)}
                        </p>
                        <p className="text-eyebrow text-celo-body font-heavy">
                          SUBMITTED:{" "}
                          {formatDate(new Date(response.submittedAt))}
                        </p>
                      </div>
                    </div>
                    {/* <div className="flex items-center gap-3">
                      <div
                        className={`px-4 py-2 border-2 border-black font-heavy text-body-s rounded-md ${getResponseStatusColor(
                          response.status
                        )}`}
                      >
                        {response.status}
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-black transition-transform duration-200 ${
                          expandedResponses.includes(response.id) ? 'rotate-180' : ''
                        }`} 
                      />
                    </div> */}
                  </button>

                  {/* Response Details - Collapsible */}
                  {expandedResponses.includes(response.id) && (
                    <div className="px-6 pb-6 border-t-2 border-black/20">
                      <div className="pt-4 space-y-4">
                        {response.responses.map((resp, index) => (
                          <div
                            key={index}
                            className="bg-celo-dk-tan border-2 border-black p-4 rounded-xl"
                          >
                            <p className="text-body-s font-heavy mb-2 text-black">
                              SUBTASK {index + 1} ({resp.type})
                            </p>
                            <p className="text-body-m text-black">
                              {Array.isArray(resp.response)
                                ? resp.response.join(", ")
                                : typeof resp.response === "number"
                                  ? `${resp.response}/10`
                                  : resp.response}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}
      </main>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border-4 border-black w-[92%] max-w-sm p-5 rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <h3 className="text-h5 font-gt-alpina font-bold text-black mb-3">ADD FUNDS</h3>
            <p className="text-body-s font-inter text-black/80 mb-4">Enter the cUSD amount to add to this task.</p>
            <input
              type="number"
              value={addFundsAmount}
              onChange={(e) => setAddFundsAmount(e.target.value)}
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-2 bg-white border-2 border-black focus:outline-none focus:border-celo-yellow text-body-m font-inter mb-4"
            />
            <p className="text-body-s font-inter text-black/80 mb-4">Wallet balance: <span className="font-heavy text-celo-forest">{balances?.cUSDBalance} cUSD</span></p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddFundsModal(false)}
                className="px-4 py-2 bg-white text-black border-2 border-black hover:bg-celo-dk-tan transition font-inter font-heavy"
              >
                CANCEL
              </button>
              <button
                onClick={handleAddFunds}
                disabled={isDepositing || !addFundsAmount || Number(addFundsAmount) <= 0}
                className="px-4 py-2 bg-celo-forest text-white border-2 border-black hover:bg-black hover:text-celo-forest transition font-inter font-heavy disabled:opacity-50"
              >
                {isDepositing ? "ADDING..." : "ADD FUNDS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-celo-dk-tan border-2 border-black w-[92%] max-w-sm p-5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <h3 className="text-h5 font-gt-alpina font-bold text-black mb-3">DELETE TASK?</h3>
            <div className="space-y-2 text-body-s font-inter text-black/90">
              <p>Deleting this task is permanent. You will not see it again, even on your dashboard.</p>
              <p className="font-heavy">Consider pausing instead if you want to hide it from users.</p>
              <p>Your remaining balance of <span className="font-heavy text-celo-forest">{Number(task.currentAmount) / 1e18} cUSD</span> will be refunded to your wallet.</p>
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white text-black border-2 border-black hover:bg-celo-dk-tan transition font-inter font-heavy"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="px-4 py-2 bg-celo-error text-white border-2 border-black hover:bg-black hover:text-celo-error transition font-inter font-heavy disabled:opacity-50"
              >
                {isDeleting ? "DELETING..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTaskDetailPage;
