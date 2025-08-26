import { PrismaClient, TaskStatus, ContactMethod, SubtaskType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create mock creator users with simple data
  const creator1 = await prisma.user.create({
    data: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      userName: 'Digital Insights Lab',
      fid: null,
      smartAddress: null,
    },
  });

  const creator2 = await prisma.user.create({
    data: {
      walletAddress: '0x2345678901234567890123456789012345678901',
      userName: 'TechWomen Foundation',
      fid: null,
      smartAddress: null,
    },
  });

  const creator3 = await prisma.user.create({
    data: {
      walletAddress: '0x3456789012345678901234567890123456789012',
      userName: 'Men\'s Health Research',
      fid: null,
      smartAddress: null,
    },
  });

  console.log('✅ Created creator users');

  // Task 1: Gen Z Digital Habits Survey (Age restricted: 19-25)
  const task1 = await prisma.task.create({
    data: {
      title: 'Gen Z Digital Habits Survey',
      description: 'A comprehensive survey to understand Gen Z digital behavior patterns, social media usage, and technology preferences.',
      blockChainId: 'task_genz_survey_001',
      maxParticipants: 50,
      currentParticipants: 0,
      baseReward: '25000000000000000000', // 25 cUSD
      maxBonusReward: '5000000000000000000', // 5 cUSD
      totalDeposited: '0',
      status: TaskStatus.ACTIVE,
      aiCriteria: 'Survey responses should demonstrate deep self-awareness, provide specific examples, demonstrate critical thinking about technology\'s role, and offer actionable insights for businesses targeting Gen Z.',
      contactMethod: ContactMethod.EMAIL,
      contactInfo: 'research@digitalinsights.com',
      creatorId: creator1.id,
      expiresAt: new Date('2024-12-31T23:59:59Z'),
      restrictionsEnabled: true,
      ageRestriction: true,
      minAge: 19,
      maxAge: 25,
      genderRestriction: false,
      countryRestriction: false,
    },
  });

  // Subtasks for Gen Z Survey
  await prisma.taskSubtask.createMany({
    data: [
      {
        taskId: task1.id,
        title: 'Social Media Usage Patterns',
        description: 'Answer questions about your daily social media habits and preferences',
        type: SubtaskType.MULTIPLE_CHOICE,
        required: true,
        order: 1,
        options: JSON.stringify(['Instagram', 'TikTok', 'Snapchat', 'Twitter', 'Facebook', 'LinkedIn', 'Other']),
      },
      {
        taskId: task1.id,
        title: 'Digital Content Consumption',
        description: 'Describe what types of content you consume most on digital platforms',
        type: SubtaskType.TEXT_INPUT,
        required: true,
        order: 2,
        placeholder: 'e.g., Educational videos, entertainment, news, lifestyle...',
        maxLength: 200,
      },
      {
        taskId: task1.id,
        title: 'Online Shopping Behavior',
        description: 'Share your experience with online shopping and what influences your decisions',
        type: SubtaskType.TEXT_INPUT,
        required: true,
        order: 3,
        placeholder: 'Describe your shopping habits, preferred platforms, and decision factors...',
        maxLength: 300,
      },
      {
        taskId: task1.id,
        title: 'Privacy Concerns',
        description: 'Rate your level of concern about data privacy on social platforms (1-10)',
        type: SubtaskType.RATING,
        required: false,
        order: 4,
      },
      {
        taskId: task1.id,
        title: 'Future Technology Predictions',
        description: 'What technology trends do you think will dominate in the next 5 years?',
        type: SubtaskType.TEXT_INPUT,
        required: false,
        order: 5,
        placeholder: 'Share your thoughts on future tech trends...',
        maxLength: 300,
      },
    ],
  });

  console.log('✅ Created Gen Z Survey task with subtasks');

  // Task 2: Women in Tech Career Development Study (Gender restricted: Female)
  const task2 = await prisma.task.create({
    data: {
      title: 'Women in Tech Career Development Study',
      description: 'An in-depth study focusing on women\'s experiences, challenges, and career development needs in the technology industry.',
      blockChainId: 'task_women_tech_002',
      maxParticipants: 30,
      currentParticipants: 0,
      baseReward: '35000000000000000000', // 35 cUSD
      maxBonusReward: '10000000000000000000', // 10 cUSD
      totalDeposited: '0',
      status: TaskStatus.ACTIVE,
      aiCriteria: 'Responses should show self-awareness, provide specific examples, demonstrate strategic thinking about career development, and offer actionable insights for improving women\'s experiences in tech.',
      contactMethod: ContactMethod.EMAIL,
      contactInfo: 'research@techwomen.org',
      creatorId: creator2.id,
      expiresAt: new Date('2024-12-31T23:59:59Z'),
      restrictionsEnabled: true,
      ageRestriction: false,
      genderRestriction: true,
      gender: 'F',
      countryRestriction: false,
    },
  });

  // Subtasks for Women in Tech Study
  await prisma.taskSubtask.createMany({
    data: [
      {
        taskId: task2.id,
        title: 'Current Role & Experience',
        description: 'Describe your current position in tech and years of experience',
        type: SubtaskType.TEXT_INPUT,
        required: true,
        order: 1,
        placeholder: 'e.g., Software Engineer with 3 years experience...',
        maxLength: 250,
      },
      {
        taskId: task2.id,
        title: 'Career Challenges Faced',
        description: 'What are the biggest challenges you\'ve encountered as a woman in tech?',
        type: SubtaskType.MULTIPLE_CHOICE,
        required: true,
        order: 2,
        options: JSON.stringify(['Gender Bias', 'Work-Life Balance', 'Imposter Syndrome', 'Lack of Mentorship', 'Pay Gap', 'Other']),
      },
      {
        taskId: task2.id,
        title: 'Mentorship & Networking',
        description: 'Share your experience with mentorship programs and professional networking',
        type: SubtaskType.TEXT_INPUT,
        required: true,
        order: 3,
        placeholder: 'Describe your mentorship experiences and networking strategies...',
        maxLength: 300,
      },
      {
        taskId: task2.id,
        title: 'Leadership Aspirations',
        description: 'Rate your interest in moving into leadership/management roles (1-10)',
        type: SubtaskType.RATING,
        required: false,
        order: 4,
      },
      {
        taskId: task2.id,
        title: 'Support Systems',
        description: 'What support systems or resources would help advance your tech career?',
        type: SubtaskType.TEXT_INPUT,
        required: true,
        order: 5,
        placeholder: 'Describe the resources and support you need...',
        maxLength: 300,
      },
      {
        taskId: task2.id,
        title: 'Future Career Goals',
        description: 'Where do you see yourself in 5 years? What steps are you taking to get there?',
        type: SubtaskType.TEXT_INPUT,
        required: false,
        order: 6,
        placeholder: 'Share your 5-year career vision and action plan...',
        maxLength: 400,
      },
    ],
  });

  console.log('✅ Created Women in Tech Study task with subtasks');

  // Task 3: AI Technology & Future Survey (General - No restrictions)
  const task3 = await prisma.task.create({
    data: {
      title: 'AI Technology & Future Survey',
      description: 'A comprehensive survey exploring public perceptions, experiences, and expectations regarding artificial intelligence technology and its impact on society.',
      blockChainId: 'task_ai_survey_003',
      maxParticipants: 50,
      currentParticipants: 0,
      baseReward: '25000000000000000000', // 25 cUSD
      maxBonusReward: '5000000000000000000', // 5 cUSD
      totalDeposited: '0',
      status: TaskStatus.ACTIVE,
      aiCriteria: 'Responses should demonstrate thoughtful consideration of AI technology, provide specific examples of AI usage, show awareness of both benefits and concerns, and offer balanced perspectives on AI\'s future impact.',
      contactMethod: ContactMethod.EMAIL,
      contactInfo: 'research@ai-future.org',
      creatorId: creator3.id,
      expiresAt: new Date('2024-12-31T23:59:59Z'),
      restrictionsEnabled: false, // No restrictions - anyone can participate
      ageRestriction: false,
      genderRestriction: false,
      countryRestriction: false,
    },
  });

  // Subtasks for AI Technology Survey
  await prisma.taskSubtask.createMany({
    data: [
      {
        taskId: task3.id,
        title: 'AI Usage Experience',
        description: 'How do you currently use AI technology in your daily life?',
        type: SubtaskType.TEXT_INPUT,
        required: true,
        order: 1,
        placeholder: 'e.g., I use ChatGPT for writing help, AI-powered apps for productivity...',
        maxLength: 300,
      },
      {
        taskId: task3.id,
        title: 'AI Applications You\'ve Tried',
        description: 'Which AI applications or tools have you personally used?',
        type: SubtaskType.MULTIPLE_CHOICE,
        required: true,
        order: 2,
        options: JSON.stringify(['ChatGPT/Claude', 'AI Image Generators', 'AI Voice Assistants', 'AI-Powered Apps', 'AI in Social Media', 'AI in Gaming', 'AI in Education', 'None of the above']),
      },
      {
        taskId: task3.id,
        title: 'AI Benefits & Concerns',
        description: 'What do you see as the biggest benefits and concerns of AI technology?',
        type: SubtaskType.TEXT_INPUT,
        required: true,
        order: 3,
        placeholder: 'Share your thoughts on both positive impacts and potential risks...',
        maxLength: 400,
      },
      {
        taskId: task3.id,
        title: 'AI in Your Industry',
        description: 'How do you think AI will impact your current industry or field of work?',
        type: SubtaskType.TEXT_INPUT,
        required: false,
        order: 4,
        placeholder: 'Describe potential changes, opportunities, or challenges...',
        maxLength: 300,
      },
      {
        taskId: task3.id,
        title: 'AI Ethics & Responsibility',
        description: 'What are your thoughts on AI ethics and who should be responsible for AI safety?',
        type: SubtaskType.TEXT_INPUT,
        required: true,
        order: 5,
        placeholder: 'Share your perspective on AI governance and ethical considerations...',
        maxLength: 350,
      },
      {
        taskId: task3.id,
        title: 'Future AI Expectations',
        description: 'Rate your optimism about AI\'s future impact on society (1-10)',
        type: SubtaskType.RATING,
        required: false,
        order: 6,
      },
    ],
  });

  console.log('✅ Created Men\'s Health Study task with subtasks');

  console.log('🎉 Database seeding completed successfully!');
  console.log(`Created ${await prisma.task.count()} tasks`);
  console.log(`Created ${await prisma.taskSubtask.count()} subtasks`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 