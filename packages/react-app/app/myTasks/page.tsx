'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {  DollarSign, Users, Eye, Edit, Target } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import { getAllTasks, getCreatorTasks } from '@/lib/Prismafnctns';
import { getTask } from '@/lib/ReadFunctions';
import { useAccount } from 'wagmi';

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
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }
    const loadMyTasks = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const allTasks = await getCreatorTasks(address as string);
        const myTasks: MyTask[] = await Promise.all(
          allTasks.map(async (task) => {
            try {
              // Get blockchain data for this task
              const blockchainTask = await getTask(BigInt(task.blockChainId));
              
              return {
                ...task,
                responses: task._count.submissions, // Will be updated with Prisma data
                totalAmount: blockchainTask.totalAmount,
                paidAmount: blockchainTask.paidAmount,
                balance: blockchainTask.totalAmount - blockchainTask.paidAmount,
              };
            } catch (error) {
              console.error(`Error fetching blockchain data for task ${task.id}:`, error);
              // Fallback with default values
              return {
                ...task,
                responses: task._count.submissions,
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
  }, [address]);

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
        return 'bg-celo-success text-white border-2 border-black';
      case 'PAUSED':
        return 'bg-celo-orange text-black border-2 border-black';
      case 'COMPLETED':
        return 'bg-celo-blue text-white border-2 border-black';
      default:
        return 'bg-celo-dk-tan text-black border-2 border-black';
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-celo-lt-tan">
        {/* Header */}
        <div className="bg-celo-yellow border-b-4 rounded-b-2xl border-black sticky top-0 z-50">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-h3 font-gt-alpina font-thin text-black">MY TASKS</h1>
                <p className="text-body-s text-celo-body font-inter">MANAGE YOUR CREATED TASKS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="px-4 py-6 pb-24">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border-4 border-black p-4 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-black rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-black rounded w-full"></div>
                  </div>
                  <div className="h-6 bg-celo-purple rounded w-16"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2">
                    <div className="h-4 bg-black rounded mb-1 w-12 mx-auto"></div>
                    <div className="h-5 bg-black rounded w-16 mx-auto"></div>
                  </div>
                  <div className="text-center p-2">
                    <div className="h-4 bg-black rounded mb-1 w-16 mx-auto"></div>
                    <div className="h-5 bg-black rounded w-8 mx-auto"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-celo-lt-tan">
        {/* Header */}
        <div className="bg-celo-yellow border-b-4 border-black rounded-b-2xl sticky top-0 z-50">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-h4 font-gt-alpina font-thin text-black">MY TASKS</h1>
                <p className="text-body-s text-celo-body font-inter">MANAGE YOUR CREATED TASKS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Not Connected State */}
        <div className="px-4 py-12 pb-24">
          <div className="text-center">
            <div className="w-20 h-20 bg-celo-purple border-4 border-black flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-h3 font-gt-alpina font-thin text-black mb-2">CONNECT YOUR WALLET</h3>
            <p className="text-body-m text-celo-body mb-6 max-w-sm mx-auto font-inter">
              Connect your wallet to view and manage your created tasks
            </p>
            <button
              onClick={() => window.location.href = '/Start'}
              className="px-6 py-3 bg-celo-purple text-white border-4 border-black hover:bg-black hover:text-celo-purple transition-all duration-200 font-inter font-heavy"
            >
              GO TO HOME
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-celo-lt-tan">
      {/* Header */}
      <div className="bg-celo-yellow border-b-4 rounded-b-2xl border-black sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h3 font-gt-alpina font-thin text-black">MY TASKS</h1>
              <p className="text-body-s text-celo-body font-inter">MANAGE YOUR CREATED TASKS</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 pb-24 space-y-4">


        {/* Tasks Grid */}
        {sortedTasks.length === 0 ? (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-celo-dk-tan border-4 border-black flex items-center justify-center mx-auto mb-6 rounded-2xl shadow-[4px_4px_0_0_rgba(55,65,81,1)]">
        <Target className="w-12 h-12 text-black" />
      </div>
      <h3 className="text-h3 font-gt-alpina font-thin text-black mb-2">NO TASKS FOUND</h3>
      <p className="text-body-m text-celo-body mb-6 font-inter">
        {searchTerm || statusFilter !== 'ALL' 
          ? 'Try adjusting your search or filters'
          : 'Create your first task to get started!'
        }
      </p>
      {!searchTerm && statusFilter === 'ALL' && (
        <button
          onClick={() => router.push('/CreateTask')}
          className="px-6 py-3 bg-celo-purple text-white border-4 border-black rounded-xl hover:bg-black hover:text-celo-purple transition-all duration-200 font-inter font-heavy shadow-[4px_4px_0_0_rgba(55,65,81,1)]"
        >
          CREATE YOUR FIRST TASK
        </button>
      )}
    </div>
  ) : (
    <div className="space-y-4 w-full">
      {sortedTasks.map((task) => (
        <div
          key={task.id}
          onClick={() => router.push(`/myTasks/${task.id}`)}
          className="bg-gradient-to-br from-white via-celo-lt-tan/10 to-white border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0_0_rgba(55,65,81,1)] hover:shadow-[6px_6px_0_0_rgba(55,65,81,1)] transition-all duration-200 cursor-pointer group w-full"
        >
          {/* Header */}
          <div className="flex flex-col mb-4 gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-inter font-extrabold text-black text-lg tracking-wide group-hover:text-celo-purple truncate transition">
                {task.title.toUpperCase()}
              </h3>
              <p className="text-body-s text-celo-body line-clamp-2 font-inter mt-1">
                {task.description}
              </p>
            </div>
            <span className={`px-3 py-1 text-xs font-inter font-bold uppercase rounded-md ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-black/20 my-3"></div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-1.5 bg-celo-lt-tan/30 rounded-lg border-2 border-black">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-celo-purple" />
                <span className="text-xs font-inter font-bold text-celo-purple">BALANCE</span>
              </div>
              <p className="text-sm font-inter font-heavy text-celo-purple">
                {(Number(task.balance) / Math.pow(10, 18)).toFixed(3)} cUSD
              </p>
            </div>

            <div className="text-center p-1.5 bg-celo-lt-tan/30 rounded-lg border-2 border-black">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-celo-forest" />
                <span className="text-xs font-inter font-bold text-celo-forest">PARTICIPANTS</span>
              </div>
              <p className="text-sm font-inter font-heavy text-celo-forest">
                {task.currentParticipants}/{task.maxParticipants}
              </p>
            </div>

            <div className="text-center p-1.5 bg-celo-lt-tan/30 rounded-lg border-2 border-black">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs font-inter font-bold text-celo-success">RESPONSES</span>
              </div>
              <p className="text-sm font-inter font-heavy text-celo-success">{task.responses}</p>
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
