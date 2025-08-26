'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, DollarSign, Users, Eye, Edit, Target, TrendingUp, Clock } from 'lucide-react';
import { getMockTasks } from '@/lib/mockData';
import { renderTaskIcon } from '@/lib/mockData';
import BottomNavigation from '@/components/BottomNavigation';
import { getAllTasks } from '@/lib/Prismafnctns';
import { getTask } from '@/lib/ReadFunctions';

type MyTask = Awaited<ReturnType<typeof getAllTasks>>[0] & { 
  responses: number;
  totalAmount: bigint;
  paidAmount: bigint;
  balance: bigint;
};

const MyTasksPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ALL');
  const [sortBy, setSortBy] = useState<'created' | 'participants' | 'budget'>('created');

  useEffect(() => {
    const loadMyTasks = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const allTasks = await getAllTasks();
        const myTasks: MyTask[] = await Promise.all(
          allTasks.map(async (task) => {
            try {
              // Get blockchain data for this task
              const blockchainTask = await getTask(BigInt(task.id));
              
              return {
                ...task,
                responses: 0, // Will be updated with Prisma data
                totalAmount: blockchainTask.totalAmount,
                paidAmount: blockchainTask.paidAmount,
                balance: blockchainTask.totalAmount - blockchainTask.paidAmount,
              };
            } catch (error) {
              console.error(`Error fetching blockchain data for task ${task.id}:`, error);
              // Fallback with default values
              return {
                ...task,
                responses: 0,
                totalAmount: BigInt(0),
                paidAmount: BigInt(0),
                balance: BigInt(0),
              };
            }
          })
        );
        
        setTasks(myTasks);
      } catch (error) {
        console.error('Error loading my tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMyTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'participants':
        return b.currentParticipants - a.currentParticipants;
      case 'budget':
        return parseFloat(b.totalDeposited) - parseFloat(a.totalDeposited);
      default:
        return 0;
    }
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-300 rounded-full mx-auto mb-4 animate-spin"></div>
          <div className="text-indigo-700 text-lg font-medium">Loading your tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-indigo-100 sticky top-0 z-50 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-600 text-sm">Manage your created tasks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 pb-24 space-y-2">


        {/* Tasks Grid */}
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started!'
              }
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <button
                onClick={() => router.push('/CreateTask')}
                className="px-6 py-3 bg-indigo-400  text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                Create Your First Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 w-full">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer w-full max-w-full overflow-hidden"
                onClick={() => router.push(`/myTasks/${task.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{task.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Task Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-purple-600">Balance</span>
                    </div>
                    <div className="text-sm font-bold text-purple-700">
                      {(Number(task.balance) / Math.pow(10, 18)).toFixed(3)} cUSD
                    </div>
                  </div>
                  
                  <div className="text-center p-2">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">Responses</span>
                    </div>
                    <div className="text-sm font-bold text-green-700">{task.responses}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MyTasksPage;
