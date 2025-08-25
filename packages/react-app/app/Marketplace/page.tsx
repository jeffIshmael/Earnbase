'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Users, Coins, Clock, ArrowRight, ArrowLeft, Plus, Target, Calendar, MapPin, User, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { formatEther } from 'viem';
import BottomNavigation from '@/components/BottomNavigation';
import Link from 'next/link';
import { getMockTasks, MockTask, renderTaskIcon, checkUserEligibility } from '@/lib/mockData';

const Marketplace = () => {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [tasks, setTasks] = useState<MockTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<MockTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'reward' | 'participants'>('newest');
  
  // Demo user profile - in real app this would come from user authentication
  const [demoUser] = useState({
    age: 22,
    gender: 'f',
    country: 'US'
  });

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const mockTasks = getMockTasks();
      setTasks(mockTasks);
      setFilteredTasks(mockTasks);
      setIsLoading(false);
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'reward':
          const aReward = parseFloat(a.reward.replace(/[^\d.]/g, ''));
          const bReward = parseFloat(b.reward.replace(/[^\d.]/g, ''));
          return bReward - aReward;
        case 'participants':
          return b.participants - a.participants;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEligibilityStatus = (task: MockTask) => {
    const eligibility = checkUserEligibility(task, demoUser.age, demoUser.gender, demoUser.country);
    return eligibility;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50">
      <div className="mb-24">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-indigo-100 p-4 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/Start')}
                className="p-2 hover:bg-indigo-50 rounded-xl transition-all duration-200 group"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" />
              </button>
              <h1 className="text-xl font-bold">
                Available Tasks
              </h1>
            </div>
            {isConnected && (
              <button
                onClick={() => router.push('/CreateTask')}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:from-indigo-700 hover:to-purple-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Create</span>
              </button>
            )}
          </div>

        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 p-4">
          <div className="max-w-7xl mx-auto space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title, description, category, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
              />
            </div>

            {/* Sort Options */}
            <div className="flex space-x-2">
              {[
                { key: 'newest', label: 'Newest' },
                { key: 'reward', label: 'Highest Reward' },
                { key: 'participants', label: 'Most Popular' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    sortBy === option.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
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
                  className={`block bg-white/80 backdrop-blur-sm rounded-xl p-4 border shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] ${
                    eligibility.eligible 
                      ? 'border-indigo-200 hover:border-indigo-300' 
                      : 'border-gray-200 opacity-75'
                  }`}
                >


                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">{task.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{task.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="capitalize">{task.category}</span>
                          <span>•</span>
                          <span>{formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Participants</span>
                      </div>
                      <p className="text-sm font-semibold text-blue-700">
                        {task.participants}/{task.maxParticipants}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Coins className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-600">Reward</span>
                      </div>
                      <p className="text-sm font-semibold text-green-700">
                        {task.reward}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-gray-600">Subtasks</span>
                      </div>
                      <p className="text-sm font-semibold text-purple-700">
                        {task.subtasks.length}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-gray-600">Time Left</span>
                      </div>
                      <p className="text-sm font-semibold text-amber-700">
                        {task.timeLeft}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end text-xs text-gray-500">

                    <div className="flex items-center space-x-1">
                      <span>View Details</span>
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