'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Target, Users, DollarSign, Clock, FileText, 
  Trophy, Medal, Award, Eye, Calendar, MapPin, User,
  CheckCircle, AlertCircle, Star, Shield, Plus, Minus, Zap,
  ChevronRight, CalendarDays, Tag, Award as AwardIcon, Coins,
  Play, ChevronDown, Heart, Share2, Bookmark, X,
  Pause, Trash2, Edit, MessageSquare, Download, Eye as EyeIcon
} from 'lucide-react';
import { getTaskDetails } from '@/lib/Prismafnctns';
import { getTask } from '@/lib/ReadFunctions';
import BottomNavigation from '@/components/BottomNavigation';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'analytics'>('overview');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const taskId = params.id as string;

  // Responses will be loaded from database
  const [responses, setResponses] = useState<TaskResponse[]>([]);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Get task data from Prisma
        const taskData = await getTaskDetails(parseInt(taskId));
        if (taskData) {
          // Get blockchain data
          const blockchainTask = await getTask(BigInt(taskId));
          
          const taskWithBlockchain: TaskWithBlockchainData = {
            id: taskData.id,
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            totalAmount: blockchainTask.totalAmount,
            paidAmount: blockchainTask.paidAmount,
            currentAmount: blockchainTask.totalAmount - blockchainTask.paidAmount,
            maxParticipants: taskData.maxParticipants,
            currentParticipants: taskData.currentParticipants,
            createdAt: taskData.createdAt,
            expiresAt: taskData.expiresAt,
            responses: [], // Will be populated from Prisma submissions
          };
          
          setTask(taskWithBlockchain);
          
          // Load responses from database
          if (taskData.submissions && taskData.submissions.length > 0) {
            const dbResponses: TaskResponse[] = taskData.submissions.map(submission => ({
              id: submission.id,
              userName: submission.user.userName,
              walletAddress: submission.user.walletAddress,
              submittedAt: submission.submittedAt,
              status: submission.status,
              responses: submission.responses?.map(response => ({
                subtaskId: response.subtaskId,
                response: response.response,
                type: response.subtask?.type || 'UNKNOWN'
              })) || []
            }));
            setResponses(dbResponses);
          }
        } else {
          setError('Task not found');
        }
      } catch (err) {
        setError('Failed to load task');
        console.error('Error loading task:', err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const handleAddFunds = async () => {
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) return;
    
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update task budget (in real app, this would update blockchain)
      if (task) {
        setTask({
          ...task,
          totalAmount: task.totalAmount + BigInt(parseFloat(addFundsAmount) * Math.pow(10, 18)),
          currentAmount: task.currentAmount + BigInt(parseFloat(addFundsAmount) * Math.pow(10, 18))
        });
      }
      
      setShowAddFundsModal(false);
      setAddFundsAmount('');
    } catch (error) {
      console.error('Error adding funds:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivateTask = async () => {
    if (!task) return;
    
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update task status
      setTask({
        ...task,
        status: task.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate back to myTasks
      router.push('/myTasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveResponse = (responseId: number) => {
    setResponses(prev => prev.map(r => 
      r.id === responseId ? { ...r, status: 'APPROVED' as const } : r
    ));
  };

  const handleRejectResponse = (responseId: number) => {
    setResponses(prev => prev.map(r => 
      r.id === responseId ? { ...r, status: 'REJECTED' as const } : r
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-pink-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Header Skeleton */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-indigo-100 sticky top-0 z-50 shadow-lg">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative px-4 py-6 pb-24 space-y-6">
          {/* Action Buttons Skeleton */}
          <div className="flex flex-wrap gap-3">
            <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-12 w-36 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Tab Navigation Skeleton */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-1 border border-indigo-100 shadow-lg">
            <div className="flex">
              <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse mx-1"></div>
              <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse mx-1"></div>
            </div>
          </div>

          {/* Hero Card Skeleton */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-indigo-100 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Reward and Status Skeleton */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Budget Cards Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg text-center">
              <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-3 animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-1 animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg text-center">
              <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-3 animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mx-auto mb-1 animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>
          </div>

          {/* Timeline Skeleton */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded mr-2 animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Delete Button Skeleton */}
          <div className="flex justify-end">
            <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-indigo-100">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-6 h-6 border-2 border-indigo-300 rounded-full animate-spin"></div>
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-1 left-1"></div>
              </div>
              <div className="text-indigo-700 text-sm font-medium">Loading task details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-3">Task Not Found</h2>
          <p className="text-red-600 mb-8">{error || 'The task you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-300 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Hard':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-indigo-100 sticky top-0 z-50 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-indigo-50 rounded-xl transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" />
              </button>
              <div className="max-w-48">
                <h1 className="text-lg font-bold text-gray-900 truncate">{task.title}</h1>
                <p className="text-gray-600 text-sm">My Task</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-4 py-6 pb-24 space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddFundsModal(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Funds</span>
          </button>
          
          <button
            onClick={handleDeactivateTask}
            disabled={isProcessing}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 shadow-lg ${
              task.status === 'ACTIVE'
                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
            }`}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : task.status === 'ACTIVE' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{task.status === 'ACTIVE' ? 'Pause Task' : 'Activate Task'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-1 border border-indigo-100 shadow-lg">
          <div className="flex">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'responses', label: `Responses(${responses.length})`, icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-indigo-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Hero Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-indigo-100 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{task.title}</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 text-sm">Task</span>
                      <Shield className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reward and Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {(Number(task.totalAmount) / Math.pow(10, 18)).toFixed(3)} cUSD
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                  {task.status}
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-6 leading-relaxed">{task.description}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="text-indigo-600 text-xs">Participants</span>
                  </div>
                  <div className="text-lg font-bold text-indigo-700">{task.currentParticipants}/{task.maxParticipants}</div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-600 text-xs">Time Left</span>
                  </div>
                  <div className="text-lg font-bold text-purple-700">
                    {task.expiresAt ? `${Math.ceil((task.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` : 'No deadline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg text-center">
                <Coins className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-sm text-green-600 mb-1">Total Spent</div>
                <div className="text-xl font-bold text-green-700">
                  {(Number(task.paidAmount) / Math.pow(10, 18)).toFixed(3)} cUSD
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg text-center">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-sm text-blue-600 mb-1">Current Balance</div>
                <div className="text-xl font-bold text-blue-700">
                  {(Number(task.currentAmount) / Math.pow(10, 18) > 0) ? (Number(task.currentAmount) / Math.pow(10, 18)).toFixed(3) : "0"} cUSD
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-purple-600 mr-2" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <span className="text-indigo-700 text-sm">Created</span>
                  <span className="font-medium text-gray-900 text-sm">{formatDate(task.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-700 text-sm">Expires</span>
                  <span className="font-medium text-red-700 text-sm">{formatDate(task.expiresAt)}</span>
                </div>
              </div>
            </div>

                      
          <div className="flex justify-end">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Task</span>
            </button>
          </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="space-y-4">
            {responses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No responses yet</h3>
                <p className="text-gray-500">Participants will appear here once they submit their responses.</p>
              </div>
            ) : (
              responses.map((response) => (
                <div key={response.id} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-indigo-100 shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{response.userName.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{response.userName}</h4>
                        <p className="text-sm text-gray-500">{response.walletAddress}</p>
                        <p className="text-xs text-gray-400">Submitted: {formatDate(new Date(response.submittedAt))}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getResponseStatusColor(response.status)}`}>
                        {response.status}
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  <div className="space-y-3 mb-4">
                    {response.responses.map((resp, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Subtask {index + 1} ({resp.type})
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {Array.isArray(resp.response) 
                            ? resp.response.join(', ')
                            : typeof resp.response === 'number'
                            ? `${resp.response}/10`
                            : resp.response
                          }
                        </div>
                      </div>
                    ))}
                  </div>


                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Funds to Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (cUSD)</label>
                <input
                  type="number"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddFundsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFunds}
                  disabled={!addFundsAmount || parseFloat(addFundsAmount) <= 0 || isProcessing}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Adding...' : 'Add Funds'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Task?</h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. All responses and data will be permanently deleted.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Deleting...' : 'Delete Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTaskDetailPage;
