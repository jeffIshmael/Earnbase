'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Users, Coins, Clock, ArrowRight, ArrowLeft, Plus, Target, Calendar, MapPin, User, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { formatEther } from 'viem';
import BottomNavigation from '@/components/BottomNavigation';
import Link from 'next/link';
import { getAllActiveTasks, TaskWithEligibility, renderTaskIcon, formatReward, getTimeLeft } from '@/lib/taskService';

const Marketplace = () => {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [tasks, setTasks] = useState<TaskWithEligibility[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithEligibility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'reward' | 'participants'>('newest');

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const activeTasks = await getAllActiveTasks();
        setTasks(activeTasks);
        setFilteredTasks(activeTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
        setFilteredTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'reward':
          const aReward = parseFloat(a.baseReward);
          const bReward = parseFloat(b.baseReward);
          return bReward - aReward;
        case 'participants':
          return b.currentParticipants - a.currentParticipants;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, sortBy]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-celo-lime text-black border-2 border-black';
      case 'Medium':
        return 'bg-celo-orange text-black border-2 border-black';
      case 'Hard':
        return 'bg-celo-error text-white border-2 border-black';
      default:
        return 'bg-celo-dk-tan text-black border-2 border-black';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-celo-success text-white border-2 border-black';
      case 'PAUSED':
        return 'bg-celo-orange text-black border-2 border-black';
      case 'COMPLETED':
        return 'bg-celo-blue text-white border-2 border-black';
      default:
        return 'bg-celo-dk-tan text-black border-2 border-black';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEligibilityStatus = (task: TaskWithEligibility) => {
    // For now, return a simple eligibility check
    return { eligible: true, reason: undefined };
  };

  return (
    <div className="min-h-screen bg-celo-lt-tan">
      <div className="mb-24">
        {/* Header */}
        <div className="bg-celo-yellow border-b-4 border-black p-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/Start')}
                className="p-2 hover:bg-black hover:text-celo-yellow border-2 border-black transition-all duration-200"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 text-black" />
              </button>
              <h1 className="text-h3 font-gt-alpina font-thin text-black">
                AVAILABLE TASKS
              </h1>
            </div>
            {isConnected && (
              <button
                onClick={() => router.push('/CreateTask')}
                className="flex items-center space-x-2 bg-celo-purple text-white px-4 py-2 border-4 border-black font-inter font-heavy hover:bg-black hover:text-celo-purple transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>CREATE</span>
              </button>
            )}
          </div>

        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white border-b-4 border-black p-4">
          <div className="max-w-7xl mx-auto space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-celo-body" />
              <input
                type="text"
                placeholder="SEARCH TASKS BY TITLE, DESCRIPTION, CATEGORY, OR TAGS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border-4 border-black focus:outline-none focus:border-celo-yellow font-inter text-black"
              />
            </div>

            {/* Sort Options */}
            <div className="flex space-x-2">
              {[
                { key: 'newest', label: 'NEWEST' },
                { key: 'reward', label: 'HIGHEST REWARD' },
                { key: 'participants', label: 'MOST POPULAR' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key as any)}
                  className={`px-3 py-1 text-eyebrow font-inter font-heavy transition-all duration-200 border-2 border-black ${
                    sortBy === option.key
                      ? 'bg-celo-yellow text-black'
                      : 'bg-celo-dk-tan text-black hover:bg-celo-yellow'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <Target className="w-16 h-16 text-celo-body mx-auto mb-4" />
            <h3 className="text-h3 font-gt-alpina font-thin text-black mb-2">NO TASKS FOUND</h3>
            <p className="text-body-m text-celo-body font-inter">
              {searchTerm ? 'Try adjusting your search terms' : 'No tasks are currently available'}
            </p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-4 space-y-4">
            {filteredTasks.map((task) => {
              const eligibility = getEligibilityStatus(task);
              
              return (
                <Link
                  key={task.id}
                  href={`/Task/${task.id}`}
                  className={`block bg-white border-4 border-black p-4 hover:bg-celo-dk-tan transition-all duration-200 ${
                    eligibility.eligible 
                      ? 'hover:border-celo-yellow' 
                      : 'opacity-75'
                  }`}
                >


                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 min-w-0">
                          <h3 className="text-body-l font-inter font-heavy text-black truncate flex-1">{task.title.toUpperCase()}</h3>
                          <span className={`px-2 py-1 text-eyebrow font-inter font-heavy flex-shrink-0 ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-body-s text-celo-body line-clamp-2 mb-2 font-inter">{task.description}</p>
                        <div className="flex items-center space-x-2 text-eyebrow text-celo-body font-inter">
                          <span className="capitalize">TASK</span>
                          <span>•</span>
                          <span>{formatDate(task.createdAt.toISOString())}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Users className="w-4 h-4 text-celo-blue" />
                        <span className="text-eyebrow text-celo-body font-inter font-heavy">PARTICIPANTS</span>
                      </div>
                      <p className="text-body-s font-inter font-heavy text-celo-blue">
                        {task.currentParticipants}/{task.maxParticipants}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Coins className="w-4 h-4 text-celo-success" />
                        <span className="text-eyebrow text-celo-body font-inter font-heavy">REWARD</span>
                      </div>
                      <p className="text-body-s font-inter font-heavy text-celo-success">
                        {formatReward(task.baseReward)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Target className="w-4 h-4 text-celo-purple" />
                        <span className="text-eyebrow text-celo-body font-inter font-heavy">SUBTASKS</span>
                      </div>
                      <p className="text-body-s font-inter font-heavy text-celo-purple">
                        {task.subtasks.length}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="w-4 h-4 text-celo-orange" />
                        <span className="text-eyebrow text-celo-body font-inter font-heavy">TIME LEFT</span>
                      </div>
                      <p className="text-body-s font-inter font-heavy text-celo-orange">
                        {task.expiresAt ? getTimeLeft(task.expiresAt as Date) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end text-eyebrow text-celo-body font-inter">

                    <div className="flex items-center space-x-1">
                      <span>VIEW DETAILS</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace; 