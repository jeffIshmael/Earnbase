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
      <div className="min-h-screen bg-celo-lt-tan">
        {/* Header Skeleton */}
        <div className="bg-celo-yellow border-b-4 border-black sticky top-0 z-50">
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

        {/* Loading indicator */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-celo-yellow border-4 border-black px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-8 h-8 border-4 border-black rounded-none animate-spin"></div>
                <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-none animate-spin absolute top-1 left-1"></div>
              </div>
              <div className="text-black text-body-m font-heavy">LOADING TASK DETAILS</div>
            </div>
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
          <h2 className="text-h3 font-gt-alpina font-thin text-black mb-4">TASK NOT FOUND</h2>
          <p className="text-body-m text-celo-body mb-12">{error || 'The task you are looking for does not exist.'}</p>
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
      case 'ACTIVE':
        return 'bg-celo-success text-white border-2 border-black';
      case 'PAUSED':
        return 'bg-celo-orange text-black border-2 border-black';
      case 'COMPLETED':
        return 'bg-celo-blue text-black border-2 border-black';
      default:
        return 'bg-celo-inactive text-white border-2 border-black';
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
        return 'bg-celo-success text-white border-2 border-black';
      case 'PENDING':
        return 'bg-celo-orange text-black border-2 border-black';
      case 'REJECTED':
        return 'bg-celo-error text-white border-2 border-black';
      default:
        return 'bg-celo-inactive text-white border-2 border-black';
    }
  };

  return (
    <div className="min-h-screen bg-celo-lt-tan">
      {/* Header */}
      <div className="bg-celo-yellow border-b-4 border-black sticky top-0 z-50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.back()}
                className="p-3 hover:bg-black hover:text-celo-yellow transition-all duration-200 group border-2 border-black"
              >
                <ArrowLeft className="w-6 h-6 text-black group-hover:text-celo-yellow" />
              </button>
              <div className="max-w-64">
                <h1 className="text-h4 font-gt-alpina font-thin text-black truncate">{task.title}</h1>
                <p className="text-body-s text-black font-inter font-heavy">MY TASK</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-6 py-8 pb-24 space-y-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowAddFundsModal(true)}
            className="flex items-center space-x-3 px-6 py-4 bg-celo-forest text-white border-4 border-black hover:bg-black hover:text-celo-forest transition-all duration-200 font-inter font-heavy text-body-m"
          >
            <Plus className="w-5 h-5" />
            <span>ADD FUNDS</span>
          </button>
          
          <button
            onClick={handleDeactivateTask}
            disabled={isProcessing}
            className={`flex items-center space-x-3 px-6 py-4 border-4 border-black transition-all duration-200 font-inter font-heavy text-body-m ${
              task.status === 'ACTIVE'
                ? 'bg-celo-orange text-black hover:bg-black hover:text-celo-orange'
                : 'bg-celo-success text-white hover:bg-black hover:text-celo-success'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin"></div>
            ) : task.status === 'ACTIVE' ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>{task.status === 'ACTIVE' ? 'PAUSE TASK' : 'ACTIVATE TASK'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-4 border-black">
          <div className="flex">
            {[
              { key: 'overview', label: 'OVERVIEW', icon: Eye },
              { key: 'responses', label: `RESPONSES (${responses.length})`, icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-3 px-4 py-4 font-inter font-heavy text-body-m transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-celo-yellow text-black border-r-4 border-black'
                    : 'bg-celo-dk-tan text-black hover:bg-celo-purple hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Card */}
            <div className="bg-white border-4 border-black p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-4 bg-celo-purple border-2 border-black">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-h3 font-gt-alpina font-thin text-black mb-2 leading-tight">{task.title}</h2>
                    <div className="flex items-center space-x-3">
                      <span className="text-body-s text-celo-body font-inter font-heavy">TASK</span>
                      <Shield className="w-5 h-5 text-celo-success" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reward and Status */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-h2 font-gt-alpina font-thin text-black">
                    {(Number(task.totalAmount) / Math.pow(10, 18)).toFixed(3)} cUSD
                  </div>
                </div>
                <div className={`px-4 py-2 border-2 border-black font-inter font-heavy text-body-s ${getStatusColor(task.status)}`}>
                  {task.status}
                </div>
              </div>

              <p className="text-body-m text-celo-body mb-8 leading-relaxed font-inter">{task.description}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-celo-dk-tan border-2 border-black p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="w-5 h-5 text-black" />
                    <span className="text-body-s text-black font-inter font-heavy">PARTICIPANTS</span>
                  </div>
                  <div className="text-h4 font-gt-alpina font-thin text-black">{task.currentParticipants}/{task.maxParticipants}</div>
                </div>
                
                <div className="bg-celo-dk-tan border-2 border-black p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Clock className="w-5 h-5 text-black" />
                    <span className="text-body-s text-black font-inter font-heavy">TIME LEFT</span>
                  </div>
                  <div className="text-h4 font-gt-alpina font-thin text-black">
                    {task.expiresAt ? `${Math.ceil((task.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` : 'No deadline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-celo-yellow border-4 border-black p-6 text-center">
                <Coins className="w-10 h-10 text-black mx-auto mb-4" />
                <div className="text-body-s text-black mb-2 font-inter font-heavy">TOTAL SPENT</div>
                <div className="text-h3 font-gt-alpina font-thin text-black">
                  {(Number(task.paidAmount) / Math.pow(10, 18)).toFixed(3)} cUSD
                </div>
              </div>
              <div className="bg-celo-purple border-4 border-black p-6 text-center">
                <DollarSign className="w-10 h-10 text-white mx-auto mb-4" />
                <div className="text-body-s text-white mb-2 font-inter font-heavy">CURRENT BALANCE</div>
                <div className="text-h3 font-gt-alpina font-thin text-white">
                  {(Number(task.currentAmount) / Math.pow(10, 18) > 0) ? (Number(task.currentAmount) / Math.pow(10, 18)).toFixed(3) : "0"} cUSD
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border-4 border-black p-6">
              <h3 className="text-h4 font-gt-alpina font-thin text-black mb-6 flex items-center">
                <Clock className="w-6 h-6 text-black mr-3" />
                TIMELINE
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-celo-dk-tan border-2 border-black">
                  <span className="text-body-s text-black font-inter font-heavy">CREATED</span>
                  <span className="text-body-m text-black font-inter">{formatDate(task.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-celo-dk-tan border-2 border-black">
                  <span className="text-body-s text-black font-inter font-heavy">EXPIRES</span>
                  <span className="text-body-m text-black font-inter">{formatDate(task.expiresAt)}</span>
                </div>
              </div>
            </div>

                      
          <div className="flex justify-end">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isProcessing}
              className="flex items-center space-x-3 px-6 py-4 bg-celo-error text-white border-4 border-black hover:bg-black hover:text-celo-error transition-all duration-200 font-inter font-heavy text-body-m disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              <span>DELETE TASK</span>
            </button>
          </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="space-y-6">
            {responses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-celo-dk-tan border-4 border-black flex items-center justify-center mx-auto mb-8">
                  <MessageSquare className="w-16 h-16 text-black" />
                </div>
                <h3 className="text-h3 font-gt-alpina font-thin text-black mb-4">NO RESPONSES YET</h3>
                <p className="text-body-m text-celo-body font-inter">Participants will appear here once they submit their responses.</p>
              </div>
            ) : (
              responses.map((response) => (
                <div key={response.id} className="bg-white border-4 border-black p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-celo-purple border-2 border-black flex items-center justify-center">
                        <span className="text-white font-gt-alpina font-thin text-h4">{response.userName.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="text-h4 font-gt-alpina font-thin text-black">{response.userName}</h4>
                        <p className="text-body-s text-celo-body font-inter">{response.walletAddress}</p>
                        <p className="text-eyebrow text-celo-body font-inter font-heavy">SUBMITTED: {formatDate(new Date(response.submittedAt))}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`px-4 py-2 border-2 border-black font-inter font-heavy text-body-s ${getResponseStatusColor(response.status)}`}>
                        {response.status}
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  <div className="space-y-4 mb-6">
                    {response.responses.map((resp, index) => (
                      <div key={index} className="bg-celo-dk-tan border-2 border-black p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-body-s font-inter font-heavy text-black">
                            SUBTASK {index + 1} ({resp.type})
                          </span>
                        </div>
                        <div className="text-body-m text-black font-inter">
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-white border-4 border-black p-8 max-w-md w-full">
            <h3 className="text-h3 font-gt-alpina font-thin text-black mb-6">ADD FUNDS TO TASK</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-body-s font-inter font-heavy text-black mb-3">AMOUNT (cUSD)</label>
                <input
                  type="number"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-4 border-black focus:ring-0 focus:border-celo-yellow bg-white text-black font-inter text-body-m"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowAddFundsModal(false)}
                  className="flex-1 px-6 py-3 bg-celo-dk-tan text-black border-4 border-black hover:bg-black hover:text-celo-dk-tan transition-all duration-200 font-inter font-heavy text-body-m"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleAddFunds}
                  disabled={!addFundsAmount || parseFloat(addFundsAmount) <= 0 || isProcessing}
                  className="flex-1 px-6 py-3 bg-celo-yellow text-black border-4 border-black hover:bg-black hover:text-celo-yellow transition-all duration-200 font-inter font-heavy text-body-m disabled:opacity-50"
                >
                  {isProcessing ? 'ADDING...' : 'ADD FUNDS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-white border-4 border-black p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-24 h-24 bg-celo-error border-4 border-black flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-h3 font-gt-alpina font-thin text-black mb-4">DELETE TASK?</h3>
              <p className="text-body-m text-celo-body mb-8 font-inter">
                This action cannot be undone. All responses and data will be permanently deleted.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 bg-celo-dk-tan text-black border-4 border-black hover:bg-black hover:text-celo-dk-tan transition-all duration-200 font-inter font-heavy text-body-m"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 bg-celo-error text-white border-4 border-black hover:bg-black hover:text-celo-error transition-all duration-200 font-inter font-heavy text-body-m disabled:opacity-50"
                >
                  {isProcessing ? 'DELETING...' : 'DELETE TASK'}
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
