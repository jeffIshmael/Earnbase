import React from 'react';
import { Target, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const TaskNotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-orange-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Task Not Found</h2>
        
        <p className="text-gray-600 mb-6">
          The task you&apos;re looking for doesn&apos;t exist or may have been removed. It could have expired, been completed, or the link might be incorrect.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/Marketplace"
            className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Target className="w-4 h-4" />
            <span>Browse Tasks</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskNotFound; 