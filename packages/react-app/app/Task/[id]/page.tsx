'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Target, Users, DollarSign, Clock, FileText, 
  Trophy, Medal, Award, TrendingUp, Eye, Calendar, MapPin, User,
  CheckCircle, AlertCircle, Star, Shield, TrendingUp as TrendingUpIcon,
  Users as UsersIcon, Shield as ShieldIcon, Plus, Minus, Zap,
  ChevronRight, CalendarDays, Tag, Award as AwardIcon, Coins,
  Play, ChevronDown, Heart, Share2, Bookmark, X
} from 'lucide-react';
import { getTaskById, TaskWithEligibility, renderTaskIcon, formatReward, getTimeLeft } from '@/lib/taskService';
import BottomNavigation from '@/components/BottomNavigation';
import SelfModal from '@/components/SelfModal';
import FormGenerator from '@/components/FormGenerator';

const TaskDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<TaskWithEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'leaderboard'>('overview');
  const [expandedSubtask, setExpandedSubtask] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isStartingTask, setIsStartingTask] = useState(false);
  const [showSelfModal, setShowSelfModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [taskStarted, setTaskStarted] = useState(false);

  const taskId = params.id as string;

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const taskData = await getTaskById(parseInt(taskId));
        if (taskData) {
          setTask(taskData);
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

  const handleStartTask = async () => {
    if (!task) return;
    
    // Check if task has actual requirements and user is not verified
    const hasRequirements = task.restrictionsEnabled && (
      (task.ageRestriction && (task.minAge || task.maxAge)) ||
      task.genderRestriction ||
      (task.countryRestriction && task.countries)
    );
    
    if (hasRequirements && !isVerified) {
      setShowSelfModal(true);
      return;
    }
    
    // No requirements or already verified - proceed to task
    setIsStartingTask(true);
    try {
      // Simulate task start process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set task as started and show form
      setIsStartingTask(false);
      setTaskStarted(true);
      
    } catch (error) {
      alert('Failed to start task. Please try again.');
      setIsStartingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-300 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="text-center z-10">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-300 rounded-full mx-auto mb-6 animate-spin"></div>
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="text-indigo-700 text-lg font-medium mb-2">Loading task...</div>
          <div className="text-indigo-500 text-sm">Please wait a moment</div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-3">Task Not Found</h2>
          <p className="text-red-600 mb-8 leading-relaxed">{error || 'The task you are looking for does not exist.'}</p>
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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">{rank}</div>;
  };

  const getSubtaskTypeIcon = (type: string) => {
    switch (type) {
      case 'TEXT_INPUT':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'MULTIPLE_CHOICE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FILE_UPLOAD':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'RATING':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'SURVEY':
        return <Users className="w-4 h-4 text-indigo-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    return (task.currentParticipants / task.maxParticipants) * 100;
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
    console.log('Task completed:', submission);
    // Here you would typically:
    // 1. Save submission to database
    // 2. Update user progress
    // 3. Handle reward distribution
    
    // For now, show success message
    alert(`Task completed successfully! Your score: ${submission.totalScore}/10`);
    
    // Reset task state
    setTaskStarted(false);
    setIsVerified(false);
  };

  // Check if task has actual requirements
  const hasRequirements = task?.restrictionsEnabled && (
    (task.ageRestriction && (task.minAge || task.maxAge)) ||
    task.genderRestriction ||
    (task.countryRestriction && task.countries)
  );

  // For now, we don't have a leaderboard in the new schema
  // This will be implemented when we add submission tracking
  const sortedLeaderboard: any[] = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-pink-200/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/90 backdrop-blur-xl border-b border-indigo-100 sticky top-0 z-50 shadow-lg">
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
                <p className="text-gray-600 text-sm">by {(task.creator.walletAddress).slice(0, 6) + '...' + (task.creator.walletAddress).slice(-4)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-4 py-6 pb-24 space-y-6">
        {/* Show FormGenerator if task is started */}
        {taskStarted ? (
          <FormGenerator 
            task={task} 
            onComplete={handleTaskComplete}
          />
        ) : (
          <>
            {/* Hero Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-indigo-100 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl border border-indigo-200">
                {(() => {
                  const iconInfo = { iconType: 'trending', iconColor: 'text-emerald-600' };
                  if (task.title.toLowerCase().includes('tech') || task.title.toLowerCase().includes('career')) {
                    iconInfo.iconType = 'users';
                    iconInfo.iconColor = 'text-purple-600';
                  } else if (task.title.toLowerCase().includes('health') || task.title.toLowerCase().includes('fitness')) {
                    iconInfo.iconType = 'shield';
                    iconInfo.iconColor = 'text-blue-600';
                  }
                  return renderTaskIcon(iconInfo.iconType, iconInfo.iconColor, 'w-6 h-6');
                })()}
              </div>
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
                {Number(task.baseReward) / Math.pow(10, 18)} cUSD
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
                {task.expiresAt ? Math.max(0, Math.ceil((new Date(task.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : '∞'} days
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleStartTask}
          disabled={isStartingTask}
          className={`w-full font-medium py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:scale-100 flex items-center justify-center space-x-2 ${
            isVerified 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              : hasRequirements 
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
          }`}
        >
          {isStartingTask ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Starting Task...</span>
            </>
          ) : isVerified ? (
            <>
              <Play className="w-5 h-5" />
              <span>Start Task</span>
            </>
          ) : hasRequirements ? (
            <>
              <Shield className="w-5 h-5" />
              <span>Verify Identity to Start</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start Task</span>
            </>
          )}
        </button>

        {/* Verification Status */}
        {hasRequirements && (
          <div className="text-center">
            {isVerified ? (
              <div className="flex items-center justify-center space-x-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Identity verified ✓</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Identity verification required</span>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-1 border border-indigo-100 shadow-lg">
          <div className="flex">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'subtasks', label: 'Tasks', icon: Target },
              { key: 'leaderboard', label: 'Leaderboard', icon: Trophy }
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
            {/* Creator */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 text-indigo-600 mr-2" />
                Creator
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{task.creator.userName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{task.creator.userName}</h4>
                  <p className="text-sm text-gray-600 truncate">{(task.creator.walletAddress).slice(0, 6) + '...' + (task.creator.walletAddress).slice(-4)}</p>
                </div>
                <div className="flex items-center space-x-1 text-green-600 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            {task.restrictionsEnabled && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-amber-600 mr-2" />
                  Requirements
                </h3>
                <div className="space-y-3">
                  {task.ageRestriction && (task.minAge || task.maxAge) && (
                    <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <CalendarDays className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-amber-700">Age Range</div>
                        <div className="text-gray-900 font-medium">{task.minAge || 0} - {task.maxAge || '∞'} years</div>
                      </div>
                    </div>
                  )}
                  {task.countryRestriction && task.countries && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-blue-700">Countries</div>
                        <div className="text-gray-900 font-medium">{task.countries}</div>
                      </div>
                    </div>
                  )}
                  {task.genderRestriction && task.gender && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <AwardIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-purple-700">Gender Required</div>
                        <div className="text-gray-900 font-medium">{task.gender === 'M' ? 'Male' : 'Female'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg text-center">
                <Coins className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-sm text-green-600 mb-1">Total Budget</div>
                <div className="text-xl font-bold text-green-700">
                  {Number(task.baseReward) / Math.pow(10, 18)} cUSD
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg text-center">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-sm text-blue-600 mb-1">Current</div>
                <div className="text-xl font-bold text-blue-700">
                  {Number(task.maxBonusReward) / Math.pow(10, 18)} cUSD
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
                  <span className="font-medium text-gray-900 text-sm">{task.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-700 text-sm">Expires</span>
                  <span className="font-medium text-red-700 text-sm">{task.expiresAt ? task.expiresAt.toLocaleDateString() : 'No expiry'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subtasks' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Target className="w-5 h-5 text-indigo-600 mr-2" />
              Tasks ({task.subtasks.length})
            </h3>
            <div className="space-y-3">
              {task.subtasks.map((subtask, index) => (
                <div key={subtask.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedSubtask(expandedSubtask === subtask.id ? null : subtask.id)}
                    className="w-full p-4 flex items-center space-x-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{subtask.title}</h4>
                        {subtask.required && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium border border-red-200">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm truncate">{subtask.description}</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSubtask === subtask.id ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {expandedSubtask === subtask.id && (
                    <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                      <div className="pt-4 space-y-2">
                        <p className="text-gray-700 text-sm leading-relaxed">{subtask.description}</p>
                        
                        {subtask.placeholder && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Placeholder:</span> {subtask.placeholder}
                          </div>
                        )}
                        {subtask.maxLength && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Max Length:</span> {subtask.maxLength} characters
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">File Types:</span> All types accepted
                        </div>
                        {subtask.options && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Options:</span> {subtask.options}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
              Leaderboard by Earnings
            </h3>
            
            {sortedLeaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No participants yet</p>
                <p className="text-gray-400">Be the first to join and earn rewards!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top 3 Podium */}
                <div className="space-y-3">
                  {sortedLeaderboard.slice(0, 3).map((participant, index) => (
                    <div key={participant.id} className={`rounded-xl p-4 border-2 transition-all ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 shadow-lg' 
                        : index === 1 
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 shadow-md'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-sm'
                    }`}>
                      <div className="flex items-center space-x-4">
                        {/* Rank Badge */}
                        <div className="flex items-center justify-center flex-shrink-0">
                          {index === 0 ? (
                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                          ) : index === 1 ? (
                            <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-slate-500 rounded-full flex items-center justify-center shadow-md">
                              <Medal className="w-6 h-6 text-white" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                              <Award className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Participant Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-gray-900 truncate text-md">{participant.userName}</h4>
                                {participant.id === 'current-user' && (
                                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium border border-indigo-200">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{participant.walletAddress}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Earnings */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-bold mb-1 ${
                            index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-amber-600'
                          }`}>
                            {participant.reward}
                          </div>
                          <div className="text-xs text-gray-500">
                            {index === 0 ? '🥇 1st Place' : index === 1 ? '🥈 2nd Place' : '🥉 3rd Place'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current User Position (if not in top 3) */}
                {(() => {
                  const currentUser = sortedLeaderboard.find(p => p.id === 'current-user');
                  if (currentUser && currentUser.rank > 3) {
                    return (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Your Position</h4>
                        <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-300">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">{currentUser.rank}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">You</h4>
                              <p className="text-xs text-gray-500">Keep going to reach the top!</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-bold text-indigo-600">{currentUser.reward}</div>
                              <div className="text-xs text-gray-500">#{currentUser.rank} of {sortedLeaderboard.length}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Total Participants Info */}
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500">
                    {sortedLeaderboard.length} total participants • 
                    <span className="text-indigo-600 font-medium ml-1">
                      Total Prize Pool: {Number(task.baseReward) / Math.pow(10, 18)} cUSD
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Self Protocol Verification Modal */}
      {showSelfModal && task && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="animate-in fade-in-0 zoom-in-95 duration-200">
            <React.Suspense fallback={
              <div className="bg-white rounded-2xl p-6 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading verification...</p>
              </div>
            }>
              <SelfModal 
                requirements={{
                  age: task.ageRestriction && task.minAge && task.maxAge ? { min: task.minAge, max: task.maxAge } : undefined,
                  gender: task.genderRestriction && task.gender ? task.gender : undefined,
                  countries: task.countryRestriction && task.countries ? [task.countries] : undefined
                }} 
                onVerificationSuccess={handleVerificationSuccess}
                onClose={handleVerificationClose}
              />
            </React.Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;