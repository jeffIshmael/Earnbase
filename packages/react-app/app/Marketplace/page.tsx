'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Users, Coins, Clock, ArrowRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { formatEther } from 'viem';
import BottomNavigation from '@/components/BottomNavigation';

interface Task {
  id: number;
  title: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  baseReward: bigint;
  maxBonusReward: bigint;
  status: string;
  createdAt: string;
  expiresAt?: string;
  creator: {
    userName: string;
    walletAddress: string;
  };
  subtasks: Array<{
    id: number;
    title: string;
    type: string;
  }>;
  _count: {
    submissions: number;
  };
}

export default function MarketplacePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'reward' | 'participants'>('newest');
  const [activeTab, setActiveTab] = useState<'discover' | 'my-tasks'>('discover');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, searchTerm, sortBy]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/get-active-tasks');
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
      } else {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortTasks = () => {
    let filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'reward':
          return Number(b.baseReward + b.maxBonusReward) - Number(a.baseReward + a.maxBonusReward);
        case 'participants':
          return b.currentParticipants - a.currentParticipants;
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-indigo-100 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">
          📋 My Created Tasks
          </h1>
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
      {
        isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-6">       
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">My Created Tasks</h3>
            <p className="text-gray-600">View your created tasks and participant feedback.</p>
          </div>
          </div>
        )
      }
      <BottomNavigation />
    </div>
  );
} 