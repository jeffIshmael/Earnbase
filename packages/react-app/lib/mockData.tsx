import { TrendingUp, Shield, Users, Target, Star, Clock, CheckCircle, AlertCircle, Award, Trophy, Medal } from 'lucide-react';

export interface MockSubtask {
  id: string;
  title: string;
  description: string;
  type: 'TEXT_INPUT' | 'MULTIPLE_CHOICE' | 'FILE_UPLOAD' | 'RATING' | 'SURVEY';
  required: boolean;
  options?: string[];
  placeholder?: string;
  maxLength?: number;
  fileTypes?: string[];
}

export interface MockParticipant {
  id: string;
  userName: string;
  walletAddress: string;
  avatar?: string;
  score: number;
  rank: number;
  submittedAt?: string;
  reward: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
  completedSubtasks: number;
  totalSubtasks: number;
}

export interface MockTask {
  id: string;
  title: string;
  description: string;
  reward: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  iconType: 'trending' | 'shield' | 'users' | 'target' | 'star' | 'clock' | 'check' | 'alert' | 'award' | 'trophy' | 'medal';
  iconColor: string;
  participants: number;
  maxParticipants: number;
  timeLeft: string;
  verified: boolean;
  creator: {
    userName: string;
    walletAddress: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  hasRequirements: boolean;
  requirements: {
    age?: { min: number; max: number };
    gender?: 'M' | 'F';
    countries?: string[];
  };
  bestResponse: string; // Comprehensive marking scheme for the task
  subtasks: MockSubtask[];
  leaderboard: MockParticipant[];
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  totalBudget: string;
  currentBudget: string;
}

// Helper function to render icons
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

export const mockTasks: MockTask[] = [
  {
    id: '1',
    title: 'Gen Z Digital Habits Survey',
    description: 'A comprehensive survey to understand Gen Z digital behavior patterns, social media usage, and technology preferences.',
    reward: '25 cUSD',
    difficulty: 'Easy',
    iconType: 'trending',
    iconColor: 'text-emerald-600',
    participants: 8,
    maxParticipants: 50,
    timeLeft: '5d',
    verified: true,
    creator: {
      userName: 'Digital Insights Lab',
      walletAddress: '0x1234...5678',
      avatar: '/avatars/digital-lab.png'
    },
    category: 'Market Research',
    tags: ['Survey', 'Gen Z', 'Digital', 'Social Media'],
    hasRequirements: true,
    requirements: {
      age: { min: 19, max: 100 },
    },
    bestResponse: `For this Gen Z Digital Habits Survey, excellent responses should demonstrate:

1. SOCIAL MEDIA USAGE PATTERNS (Subtask 1):
   - Clear identification of primary platforms used (Instagram, TikTok, Snapchat, etc.)
   - Specific usage frequency and time spent
   - Context of when and why they use each platform

2. DIGITAL CONTENT CONSUMPTION (Subtask 2):
   - Detailed description of content types consumed (educational, entertainment, news, lifestyle)
   - Specific examples of favorite content creators or channels
   - Time allocation across different content categories

3. ONLINE SHOPPING BEHAVIOR (Subtask 3):
   - Personal shopping habits and frequency
   - Factors influencing purchase decisions (reviews, influencers, price, convenience)
   - Experience with different shopping platforms

4. PRIVACY CONCERNS (Subtask 4):
   - Honest assessment of privacy awareness level (1-10)
   - Specific concerns about data collection and usage
   - Actions taken to protect privacy

5. FUTURE TECHNOLOGY PREDICTIONS (Subtask 5):
   - Thoughtful predictions about emerging tech trends
   - Personal interest in specific technologies
   - Impact on daily life and society

Top responses will show deep self-awareness, provide specific examples, demonstrate critical thinking about technology's role, and offer actionable insights for businesses targeting Gen Z.`,
    subtasks: [
      {
        id: '1-1',
        title: 'Social Media Usage Patterns',
        description: 'Answer questions about your daily social media habits and preferences',
        type: 'MULTIPLE_CHOICE',
        required: true,
        options: ['Instagram', 'TikTok', 'Snapchat', 'Twitter', 'Facebook', 'LinkedIn', 'Other']
      },
      {
        id: '1-2',
        title: 'Digital Content Consumption',
        description: 'Describe what types of content you consume most on digital platforms',
        type: 'TEXT_INPUT',
        required: true,
        placeholder: 'e.g., Educational videos, entertainment, news, lifestyle...',
        maxLength: 200
      },
      {
        id: '1-3',
        title: 'Online Shopping Behavior',
        description: 'Share your experience with online shopping and what influences your decisions',
        type: 'SURVEY',
        required: true
      },
      {
        id: '1-4',
        title: 'Privacy Concerns',
        description: 'Rate your level of concern about data privacy on social platforms (1-10)',
        type: 'RATING',
        required: false
      },
      {
        id: '1-5',
        title: 'Future Technology Predictions',
        description: 'What technology trends do you think will dominate in the next 5 years?',
        type: 'TEXT_INPUT',
        required: false,
        placeholder: 'Share your thoughts on future tech trends...',
        maxLength: 300
      }
    ],
    leaderboard: [
      {
        id: 'p1',
        userName: 'Alex Chen',
        walletAddress: '0xabcd...1234',
        rank: 1,
        score: 9.5,
        completedSubtasks: 5,
        totalSubtasks: 5,
        reward: '25 cUSD',
        status: 'APPROVED',
        feedback: 'Excellent insights on Gen Z behavior patterns!',
        submittedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'p2',
        userName: 'Jordan Smith',
        walletAddress: '0xefgh...5678',
        rank: 2,
        score: 9.2,
        completedSubtasks: 5,
        totalSubtasks: 5,
        reward: '22 cUSD',
        status: 'APPROVED',
        feedback: 'Great understanding of digital trends!'
      },
      {
        id: 'p3',
        userName: 'Taylor Johnson',
        walletAddress: '0xijkl...9012',
        rank: 3,
        score: 8.8,
        completedSubtasks: 4,
        totalSubtasks: 5,
        reward: '20 cUSD',
        status: 'APPROVED',
        feedback: 'Good responses, could be more detailed.'
      }
    ],
    status: 'ACTIVE',
    createdAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-02-15T23:59:59Z',
    totalBudget: '1500 cUSD',
    currentBudget: '1200 cUSD'
  },
  {
    id: '2',
    title: 'Women in Tech Career Development Study',
    description: 'An in-depth study focusing on women\'s experiences, challenges, and career development needs in the technology industry.',
    reward: '35 cUSD',
    difficulty: 'Medium',
    iconType: 'users',
    iconColor: 'text-purple-600',
    participants: 12,
    maxParticipants: 30,
    timeLeft: '3d',
    verified: true,
    creator: {
      userName: 'TechWomen Foundation',
      walletAddress: '0x5678...9012',
      avatar: '/avatars/techwomen.png'
    },
    category: 'Career Research',
    tags: ['Women in Tech', 'Career', 'Professional Development', 'Survey'],
    hasRequirements: true,
    requirements: {
      gender: 'F',

    },
    bestResponse: `For this Women in Tech Career Development Study, excellent responses should demonstrate:

1. CURRENT ROLE & EXPERIENCE (Subtask 1):
   - Clear description of current position and responsibilities
   - Specific years of experience in tech industry
   - Technical skills and technologies used
   - Career progression and growth

2. CAREER CHALLENGES FACED (Subtask 2):
   - Honest identification of specific challenges (gender bias, imposter syndrome, etc.)
   - Personal examples and experiences
   - Impact on career development and decisions
   - Coping strategies used

3. MENTORSHIP & NETWORKING (Subtask 3):
   - Experience with formal and informal mentorship
   - Professional network development strategies
   - Benefits and challenges of networking
   - Recommendations for others

4. LEADERSHIP ASPIRATIONS (Subtask 4):
   - Clear rating (1-10) with explanation
   - Specific leadership goals and timeline
   - Skills needed for leadership roles
   - Preparation and development plans

5. SUPPORT SYSTEMS (Subtask 5):
   - Specific resources and support needed
   - Current support systems available
   - Gaps in support and recommendations
   - How organizations can better support women

6. FUTURE CAREER GOALS (Subtask 6):
   - Clear 5-year vision with specific milestones
   - Actionable steps and timeline
   - Skills development plan
   - Long-term career aspirations

Top responses will show self-awareness, provide specific examples, demonstrate strategic thinking about career development, and offer actionable insights for improving women's experiences in tech.`,
    subtasks: [
      {
        id: '2-1',
        title: 'Current Role & Experience',
        description: 'Describe your current position in tech and years of experience',
        type: 'TEXT_INPUT',
        required: true,
        placeholder: 'e.g., Software Engineer with 3 years experience...',
        maxLength: 250
      },
      {
        id: '2-2',
        title: 'Career Challenges Faced',
        description: 'What are the biggest challenges you\'ve encountered as a woman in tech?',
        type: 'MULTIPLE_CHOICE',
        required: true,
        options: ['Gender Bias', 'Work-Life Balance', 'Imposter Syndrome', 'Lack of Mentorship', 'Pay Gap', 'Other']
      },
      {
        id: '2-3',
        title: 'Mentorship & Networking',
        description: 'Share your experience with mentorship programs and professional networking',
        type: 'SURVEY',
        required: true
      },
      {
        id: '2-4',
        title: 'Leadership Aspirations',
        description: 'Rate your interest in moving into leadership/management roles (1-10)',
        type: 'RATING',
        required: false
      },
      {
        id: '2-5',
        title: 'Support Systems',
        description: 'What support systems or resources would help advance your tech career?',
        type: 'TEXT_INPUT',
        required: true,
        placeholder: 'Describe the resources and support you need...',
        maxLength: 300
      },
      {
        id: '2-6',
        title: 'Future Career Goals',
        description: 'Where do you see yourself in 5 years? What steps are you taking to get there?',
        type: 'TEXT_INPUT',
        required: false,
        placeholder: 'Share your 5-year career vision and action plan...',
        maxLength: 400
      }
    ],
    leaderboard: [
      {
        id: 'p4',
        userName: 'Sarah Williams',
        walletAddress: '0xmnop...3456',
        rank: 1,
        score: 9.8,
        completedSubtasks: 6,
        totalSubtasks: 6,
        reward: '35 cUSD',
        status: 'APPROVED',
        feedback: 'Outstanding insights on women\'s tech career challenges!'
      },
      {
        id: 'p5',
        userName: 'Maria Rodriguez',
        walletAddress: '0xqrst...7890',
        rank: 2,
        score: 9.4,
        completedSubtasks: 6,
        totalSubtasks: 6,
        reward: '32 cUSD',
        status: 'APPROVED',
        feedback: 'Excellent understanding of career development needs!'
      },
      {
        id: 'p6',
        userName: 'Emma Thompson',
        walletAddress: '0xuvwx...1234',
        rank: 3,
        score: 9.1,
        completedSubtasks: 5,
        totalSubtasks: 6,
        reward: '30 cUSD',
        status: 'APPROVED',
        feedback: 'Great responses, very thoughtful insights!'
      }
    ],
    status: 'ACTIVE',
    createdAt: '2024-01-20T14:30:00Z',
    expiresAt: '2024-02-20T23:59:59Z',
    totalBudget: '1200 cUSD',
    currentBudget: '800 cUSD'
  },
  {
    id: '3',
    title: 'Chamapay Beta Testers',
    description: 'Help test and improve the Chamapay payment platform by providing feedback on user experience and identifying potential issues.',
    reward: '20+ cUSD',
    difficulty: 'Easy',
    iconType: 'shield',
    iconColor: 'text-blue-600',
    participants: 15,
    maxParticipants: 25,
    timeLeft: '2d',
    verified: true,
    creator: {
      userName: 'Chamapay Team',
      walletAddress: '0x1234...5678',
      avatar: '/avatars/chamapay.png'
    },
    category: 'Payment Testing',
    tags: ['Beta', 'Payments', 'Mobile'],
    hasRequirements: false,
    requirements: {
   
    },
    bestResponse: `For this Chamapay Beta Testing task, excellent responses should demonstrate:

1. ACCOUNT SETUP & VERIFICATION (Subtask 1):
   - Clear description of the verification process
   - Any issues encountered during setup
   - Time taken to complete verification
   - Suggestions for improving the process

2. PAYMENT METHOD TESTING (Subtask 2):
   - Experience with different payment methods
   - Ease of adding and removing payment options
   - Any technical issues encountered
   - User interface feedback for payment management

3. TRANSACTION FLOW TESTING (Subtask 3):
   - Detailed description of test transaction process
   - Screenshots or videos showing the flow
   - Any errors or issues encountered
   - Suggestions for improving user experience

4. USER EXPERIENCE RATING (Subtask 4):
   - Honest rating (1-10) with specific reasoning
   - What worked well in the interface
   - Areas that need improvement
   - Overall satisfaction with the platform

5. FEATURE FEEDBACK SURVEY (Subtask 5):
   - Specific feedback on new features tested
   - Usability and functionality assessment
   - Comparison with other payment platforms
   - Recommendations for feature improvements

Top responses will provide detailed testing feedback, include visual evidence when possible, identify specific issues and improvements, and demonstrate thorough understanding of the testing process. Feedback should be constructive and actionable for the development team.`,
    subtasks: [
      {
        id: '3-1',
        title: 'Account Setup & Verification',
        description: 'Create a new account and complete the verification process',
        type: 'TEXT_INPUT',
        required: true,
        placeholder: 'Enter your verification code',
        maxLength: 6
      },
      {
        id: '3-2',
        title: 'Payment Method Testing',
        description: 'Test adding and removing different payment methods',
        type: 'MULTIPLE_CHOICE',
        required: true,
        options: ['Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet']
      },
      {
        id: '3-3',
        title: 'Transaction Flow Testing',
        description: 'Complete a test transaction and report any issues',
        type: 'FILE_UPLOAD',
        required: true,
        fileTypes: ['png', 'jpg', 'mp4'],
        placeholder: 'Upload screenshot or video of the transaction'
      },
      {
        id: '3-4',
        title: 'User Experience Rating',
        description: 'Rate the overall user experience from 1-10',
        type: 'RATING',
        required: false
      },
      {
        id: '3-5',
        title: 'Feature Feedback Survey',
        description: 'Provide detailed feedback on new features',
        type: 'SURVEY',
        required: false
      }
    ],
    leaderboard: [
      {
        id: 'p7',
        userName: 'David Kim',
        walletAddress: '0xabcd...5678',
        rank: 1,
        score: 9.2,
        completedSubtasks: 5,
        totalSubtasks: 5,
        reward: '22 cUSD',
        status: 'APPROVED',
        feedback: 'Great testing feedback, very thorough!'
      },
      {
        id: 'p8',
        userName: 'Lisa Chen',
        walletAddress: '0xefgh...9012',
        rank: 2,
        score: 8.9,
        completedSubtasks: 4,
        totalSubtasks: 5,
        reward: '20 cUSD',
        status: 'APPROVED',
        feedback: 'Good testing approach, helpful insights!'
      },
      {
        id: 'p9',
        userName: 'Mike Johnson',
        walletAddress: '0xijkl...3456',
        rank: 3,
        score: 8.5,
        completedSubtasks: 4,
        totalSubtasks: 5,
        reward: '18 cUSD',
        status: 'APPROVED',
        feedback: 'Solid testing work, identified key issues!'
      }
    ],
    status: 'ACTIVE',
    createdAt: '2024-01-10T09:00:00Z',
    expiresAt: '2024-02-10T23:59:59Z',
    totalBudget: '800 cUSD',
    currentBudget: '600 cUSD'
  }
];

export const getMockTaskById = (id: string): MockTask | undefined => {
  const task = mockTasks.find(task => task.id === id);
  if (task) {
    // Add a demo current user to the leaderboard for testing
    const currentUser: MockParticipant = {
      id: 'current-user',
      userName: 'You',
      walletAddress: '0x1234...5678',
      score: 8.5,
      rank: 4, // Position 4 (not in top 3)
      reward: '18 cUSD',
      status: 'PENDING',
      feedback: 'Great task! Looking forward to more.',
      completedSubtasks: 4,
      totalSubtasks: 5,
      submittedAt: new Date().toISOString()
    };
    
    return {
      ...task,
      leaderboard: [...task.leaderboard, currentUser]
    };
  }
  return task;
};

export const getMockTasks = (): MockTask[] => {
  return mockTasks;
}; 

// Helper function to check if user meets task requirements
export const checkUserEligibility = (
  task: MockTask,
  userAge?: number,
  userGender?: string,
  userCountry?: string
): { eligible: boolean; reason?: string } => {
  // Check age restrictions
  if (task.requirements?.age && userAge !== undefined) {
    if (userAge < task.requirements.age.min || userAge > task.requirements.age.max) {
      return {
        eligible: false,
        reason: `Age requirement: ${task.requirements.age.min}-${task.requirements.age.max} years`
      };
    }
  }


  // Check country restrictions
  if (task.requirements?.countries && userCountry) {
    if (!task.requirements.countries.includes(userCountry)) {
      return {
        eligible: false,
        reason: `Country requirement: Available in ${task.requirements.countries.join(', ')}`
      };
    }
  }

  return { eligible: true };
};

// Function to get tasks filtered by user eligibility
export const getEligibleTasks = (
  userAge?: number,
  userGender?: string,
  userCountry?: string
): MockTask[] => {
  return mockTasks.filter(task => {
    const eligibility = checkUserEligibility(task, userAge, userGender, userCountry);
    return eligibility.eligible;
  });
};

// Function to get tasks with eligibility status for a specific user
export const getTasksWithEligibility = (
  userAge?: number,
  userGender?: string,
  userCountry?: string
): Array<MockTask & { userEligible: boolean; eligibilityReason?: string }> => {
  return mockTasks.map(task => {
    const eligibility = checkUserEligibility(task, userAge, userGender, userCountry);
    return {
      ...task,
      userEligible: eligibility.eligible,
      eligibilityReason: eligibility.reason
    };
  });
}; 