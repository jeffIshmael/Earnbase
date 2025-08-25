import React from 'react';
import { Target, Users, DollarSign, FileText, Trophy } from 'lucide-react';

const TaskDetailLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Skeleton */}
      <div className="relative bg-white/90 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 py-4 pb-24">
        {/* Task Overview Card Skeleton */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white/50 shadow-xl">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse mx-auto"></div>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse mx-auto"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-1 mb-6 border border-white/50 shadow-xl">
          <div className="flex space-x-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Tab Content Skeleton */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/50 shadow-xl">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="w-28 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailLoading; 