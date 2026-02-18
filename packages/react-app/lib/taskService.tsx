import { getActiveTasks, getTasksWithRestrictions } from './Prismafnctns';

export interface TaskWithEligibility {
  id: number;
  blockChainId: string;
  title: string;
  description: string;
  baseReward: string;
  maxBonusReward: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  aiCriteria: string;
  contactMethod: string;
  contactInfo: string;
  createdAt: Date;
  expiresAt: Date | null;
  restrictionsEnabled: boolean;
  ageRestriction: boolean;
  minAge: number | null;
  maxAge: number | null;
  genderRestriction: boolean;
  gender: string | null;
  countryRestriction: boolean;
  countries: string | null;
  creator: {
    userName: string;
    walletAddress: string;
  };
  subtasks: Array<{
    id: number;
    title: string;
    description: string | null;
    type: string;
    required: boolean;
    order: number;
    options: string | null;
    placeholder: string | null;
    maxLength: number | null;
  }>;
  _count: {
    submissions: number;
  };
  userEligible?: boolean;
  eligibilityReason?: string;
}

export interface TaskIconInfo {
  iconType: string;
  iconColor: string;
}

// Helper function to determine task icon based on category/type
export const getTaskIconInfo = (task: TaskWithEligibility): TaskIconInfo => {
  const title = task.title.toLowerCase();

  if (title.includes('survey') || title.includes('study')) {
    return { iconType: 'trending', iconColor: 'text-emerald-600' };
  } else if (title.includes('tech') || title.includes('career')) {
    return { iconType: 'users', iconColor: 'text-purple-600' };
  } else if (title.includes('health') || title.includes('fitness')) {
    return { iconType: 'shield', iconColor: 'text-blue-600' };
  } else if (title.includes('payment') || title.includes('finance')) {
    return { iconType: 'target', iconColor: 'text-green-600' };
  } else {
    return { iconType: 'star', iconColor: 'text-indigo-600' };
  }
};

// Helper function to render task icon
export const renderTaskIcon = (iconType: string, iconColor: string, size: string = 'w-4 h-4') => {
  const iconClass = `${size} ${iconColor}`;

  switch (iconType) {
    case 'trending':
      return <div className={`${iconClass} bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-1`} />;
    case 'shield':
      return <div className={`${iconClass} bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-1`} />;
    case 'users':
      return <div className={`${iconClass} bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-1`} />;
    case 'target':
      return <div className={`${iconClass} bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-1`} />;
    case 'star':
      return <div className={`${iconClass} bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg p-1`} />;
    case 'clock':
      return <div className={`${iconClass} bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg p-1`} />;
    case 'check':
      return <div className={`${iconClass} bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-1`} />;
    case 'alert':
      return <div className={`${iconClass} bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-1`} />;
    case 'award':
      return <div className={`${iconClass} bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg p-1`} />;
    case 'trophy':
      return <div className={`${iconClass} bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-1`} />;
    case 'medal':
      return <div className={`${iconClass} bg-gradient-to-r from-gray-400 to-slate-500 rounded-lg p-1`} />;
    default:
      return <div className={`${iconClass} bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg p-1`} />;
  }
};

// Helper function to check if user meets task requirements
export const checkUserEligibility = (
  task: TaskWithEligibility,
  userAge?: number,
  userGender?: string,
  userCountry?: string
): { eligible: boolean; reason?: string } => {
  // Check age restrictions
  if (task.ageRestriction && userAge !== undefined) {
    if (task.minAge && userAge < task.minAge) {
      return {
        eligible: false,
        reason: `Age requirement: ${task.minAge} years or older`
      };
    }
    if (task.maxAge && userAge > task.maxAge) {
      return {
        eligible: false,
        reason: `Age requirement: ${task.maxAge} years or younger`
      };
    }
  }

  // Check gender restrictions
  if (task.genderRestriction && userGender && task.gender) {
    if (userGender !== task.gender) {
      return {
        eligible: false,
        reason: `Gender requirement: ${task.gender === 'M' ? 'Male' : 'Female'} only`
      };
    }
  }

  // Check country restrictions
  if (task.countryRestriction && task.countries && userCountry) {
    try {
      const allowedCountries = JSON.parse(task.countries);
      if (!allowedCountries.includes(userCountry)) {
        return {
          eligible: false,
          reason: `Country requirement: Available in ${allowedCountries.join(', ')}`
        };
      }
    } catch (error) {
      console.error('Error parsing countries:', error);
    }
  }

  return { eligible: true };
};

// Function to get all active tasks
export const getAllActiveTasks = async (): Promise<TaskWithEligibility[]> => {
  try {
    const tasks = await getActiveTasks();
    return tasks.map((task: any) => ({
      ...task,
      userEligible: true, // Default to eligible for now
      eligibilityReason: undefined
    }));
  } catch (error) {
    console.error('Error fetching active tasks:', error);
    return [];
  }
};

// Function to get tasks with eligibility status for a specific user
export const getTasksWithEligibility = async (
  userAge?: number,
  userGender?: string,
  userCountry?: string
): Promise<TaskWithEligibility[]> => {
  try {
    const tasks = await getActiveTasks();
    return tasks.map((task: any) => {
      const eligibility = checkUserEligibility(task, userAge, userGender, userCountry);
      return {
        ...task,
        userEligible: eligibility.eligible,
        eligibilityReason: eligibility.reason
      };
    });
  } catch (error) {
    console.error('Error fetching tasks with eligibility:', error);
    return [];
  }
};

// Function to get a specific task by ID
export const getTaskById = async (id: number): Promise<TaskWithEligibility | null> => {
  try {
    const tasks = await getActiveTasks();
    const task = tasks.find((t: any) => t.id === id);
    if (task) {
      return {
        ...task,
        userEligible: true,
        eligibilityReason: undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    return null;
  }
};

// Helper function to format reward amount
export const formatReward = (reward: string): string => {
  try {
    // Convert from base units to USDC (assuming 6 decimals)
    const amount = BigInt(reward);
    const usdcAmount = Number(amount) / Math.pow(10, 6);
    return `${usdcAmount.toFixed(2)} USDC`;
  } catch (error) {
    return '0 USDC';
  }
};

// Helper function to calculate time left
export const getTimeLeft = (expiresAt?: Date): string => {
  if (!expiresAt) return 'No deadline';

  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Less than 1h';
}; 