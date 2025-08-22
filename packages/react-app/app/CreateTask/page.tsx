'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, Sparkles, Target, Users, DollarSign, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { SubtaskType, ContactMethod } from '@prisma/client';
import BottomNavigation from '@/components/BottomNavigation';

interface Subtask {
  id: string;
  title: string;
  description: string;
  type: SubtaskType;
  required: boolean;
  order: number;
  options?: string;
  placeholder?: string;
  maxLength?: number;
  fileTypes?: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Task basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [baseReward, setBaseReward] = useState('');
  const [maxBonusReward, setMaxBonusReward] = useState('');
  const [aiCriteria, setAiCriteria] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('EMAIL');
  const [contactInfo, setContactInfo] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  
  // Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    {
      id: '1',
      title: '',
      description: '',
      type: 'TEXT_INPUT',
      required: true,
      order: 1,
      placeholder: '',
      maxLength: 500,
    }
  ]);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Task title is required';
    if (!description.trim()) newErrors.description = 'Task description is required';
    if (maxParticipants < 1) newErrors.maxParticipants = 'Max participants must be at least 1';
    if (!baseReward || parseFloat(baseReward) <= 0) newErrors.baseReward = 'Base reward must be greater than 0';
    if (!maxBonusReward || parseFloat(maxBonusReward) < 0) newErrors.maxBonusReward = 'Max bonus reward cannot be negative';
    if (!aiCriteria.trim()) newErrors.aiCriteria = 'AI criteria is required';
    if (!contactInfo.trim()) newErrors.contactInfo = 'Contact information is required';

    // Validate subtasks
    subtasks.forEach((subtask, index) => {
      if (!subtask.title.trim()) {
        newErrors[`subtask-${index}-title`] = 'Subtask title is required';
      }
      if (subtask.type === 'MULTIPLE_CHOICE' && !subtask.options?.trim()) {
        newErrors[`subtask-${index}-options`] = 'Multiple choice options are required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addSubtask = () => {
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'TEXT_INPUT',
      required: true,
      order: subtasks.length + 1,
      placeholder: '',
      maxLength: 500,
    };
    setSubtasks([...subtasks, newSubtask]);
  };

  const removeSubtask = (id: string) => {
    if (subtasks.length > 1) {
      const filtered = subtasks.filter(s => s.id !== id);
      // Reorder remaining subtasks
      const reordered = filtered.map((s, index) => ({ ...s, order: index + 1 }));
      setSubtasks(reordered);
    }
  };

  const updateSubtask = (id: string, field: keyof Subtask, value: any) => {
    setSubtasks(subtasks.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const calculateTotalRequired = () => {
    const base = parseFloat(baseReward) || 0;
    const bonus = parseFloat(maxBonusReward) || 0;
    return (base + bonus) * maxParticipants;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/create-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorAddress: address,
          title: title.trim(),
          description: description.trim(),
          maxParticipants,
          baseReward,
          maxBonusReward,
          aiCriteria: aiCriteria.trim(),
          contactMethod,
          contactInfo: contactInfo.trim(),
          expiresAt: expiresAt || undefined,
          subtasks: subtasks.map(s => ({
            title: s.title.trim(),
            description: s.description.trim() || undefined,
            type: s.type,
            required: s.required,
            order: s.order,
            options: s.options || undefined,
            placeholder: s.placeholder || undefined,
            maxLength: s.maxLength || undefined,
            fileTypes: s.fileTypes || undefined,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Task created successfully!');
        router.push(`/Task/${data.taskId}`);
      } else {
        throw new Error(data.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet Required</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to create tasks.
          </p>
          <button
            onClick={() => router.push('/Start')}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
     <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-12 w-96 h-96 bg-gradient-to-br from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 p-4 sticky top-0 z-20 shadow-xl shadow-indigo-500/5">
        <div className="flex items-center justify-between ">
          <div className="flex items-center space-x-2">
            <button className="p-3 hover:bg-white/60 rounded-xl transition-all duration-200 hover:shadow-lg">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                Create New Task
              </h1>
              <p className="text-gray-400 text-sm">Build engaging tasks and reward participants</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto p-6 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Progress indicator */}
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Setup Progress</h3>
              <span className="text-sm text-gray-600">Step 1 of 5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full w-1/5 transition-all duration-300"></div>
            </div>
          </div>

          {/* Basic Task Information */}
          <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-4 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Task Information</h2>
                <p className="text-gray-400 text-sm">Define what participants will accomplish</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200"
                  placeholder="Engaging title..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Max Participants *
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full pl-12 pr-5 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Task Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-2 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 resize-none"
                placeholder="Describe what participants need to do in detail. Be specific about requirements and expectations..."
              />
            </div>
          </div>

          {/* Reward Structure */}
          <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-4 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reward Structure</h2>
                <p className="text-gray-400 text-sm">Set up incentives for quality participation</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">
                  Base Reward (cUSD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={baseReward}
                    onChange={(e) => setBaseReward(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-5 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-400 transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Max Bonus (cUSD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={maxBonusReward}
                    onChange={(e) => setMaxBonusReward(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-5 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-400 transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <label className="text-sm font-semibold text-green-800">
                    Total Required
                  </label>
                </div>
                <p className="text-3xl font-bold text-green-700 mb-2">
                  ${calculateTotalRequired().toFixed(2)}
                </p>
                <p className="text-sm text-green-600">
                  {maxParticipants} participants × (${parseFloat(baseReward) || 0} + ${parseFloat(maxBonusReward) || 0})
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-800">How rewards work</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    All participants receive the base reward. Bonus rewards are distributed based on AI rating of submission quality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Rating Criteria */}
          <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-4 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Rating Criteria</h2>
                <p className="text-gray-400 text-sm">Define quality standards for automatic evaluation</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Rating Criteria *
              </label>
              <textarea
                value={aiCriteria}
                onChange={(e) => setAiCriteria(e.target.value)}
                rows={5}
                className="w-full px-5 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 resize-none"
                placeholder="Example: Look for detailed feedback, specific suggestions, constructive criticism, and actionable insights. Higher ratings for comprehensive responses that show understanding of the task."
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-4 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                <p className="text-gray-400 text-sm">How participants can reach you and how you will get the feedbacks.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Contact Method *
                </label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value as ContactMethod)}
                  className="w-full px-5 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                >
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Contact Info *
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-5 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                  placeholder={contactMethod === 'EMAIL' ? 'your@email.com' : '+1234567890'}
                />
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Ending Date (Optional)
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Subtasks */}
          <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-4 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Subtasks</h2>
                  <p className="text-gray-400 text-sm">Break down your task into manageable parts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addSubtask}
                className="flex items-center space-x-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-6">
              {subtasks.map((subtask, index) => (
                <div key={subtask.id} className="bg-white/70 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <span className="bg-indigo-100 text-indigo-800 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span>Subtask {index + 1}</span>
                    </h3>
                    {subtasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubtask(subtask.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(e) => updateSubtask(subtask.id, 'title', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200"
                        placeholder="Enter subtask title"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        Type *
                      </label>
                      <select
                        value={subtask.type}
                        onChange={(e) => updateSubtask(subtask.id, 'type', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200"
                      >
                        <option value="TEXT_INPUT">Text Input</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                        <option value="CHOICE_SELECTION">Choice Selection</option>
                        <option value="RATING">Rating</option>
                        <option value="FILE_UPLOAD">File Upload</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Description (Optional)
                    </label>
                    <textarea
                      value={subtask.description}
                      onChange={(e) => updateSubtask(subtask.id, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 resize-none"
                      placeholder="Additional details about this subtask..."
                    />
                  </div>

                  {subtask.type === 'MULTIPLE_CHOICE' && (
                    <div className="mt-6 space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        Options (one per line) *
                      </label>
                      <textarea
                        value={subtask.options || ''}
                        onChange={(e) => updateSubtask(subtask.id, 'options', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 resize-none"
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                      />
                    </div>
                  )}

                  <div className="mt-6">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={subtask.required}
                        onChange={(e) => updateSubtask(subtask.id, 'required', e.target.checked)}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-semibold text-gray-800">Required</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Your Task...</span>
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  <span>Create Task & Go Live</span>
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
      <BottomNavigation />
    </div>
  );
} 