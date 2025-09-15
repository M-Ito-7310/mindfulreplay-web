const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo data...');

    // Create demo user
    const demoUser = await prisma.user.upsert({
      where: { id: 'user1' },
      update: {},
      create: {
        id: 'user1',
        email: 'demo@mindfulreplay.com',
        username: 'demo',
        displayName: 'Demo User',
        name: 'Demo User',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Demo user created:', demoUser.email);

    // Create demo videos
    const demoVideos = [
      {
        id: 'video1',
        userId: 'user1',
        youtubeId: 'dQw4w9WgXcQ',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Introduction to React Hooks',
        description: 'Learn the basics of React Hooks and how to use them effectively in your applications.',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: 1200,
        channelName: 'React Tutorials',
        publishedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'video2',
        userId: 'user1',
        youtubeId: 'jNQXAC9IVRw',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        title: 'Advanced TypeScript Patterns',
        description: 'Explore advanced TypeScript patterns for building scalable applications.',
        thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
        duration: 1800,
        channelName: 'TypeScript Pro',
        publishedAt: new Date('2024-01-05T00:00:00Z'),
      }
    ];

    for (const videoData of demoVideos) {
      const video = await prisma.video.upsert({
        where: { id: videoData.id },
        update: {},
        create: videoData,
      });
      console.log('✅ Demo video created:', video.title);
    }

    // Create demo memos
    const demoMemos = [
      {
        id: 'memo1',
        userId: 'user1',
        videoId: 'video1',
        content: 'React Hooks revolutionize state management in functional components. Key takeaway: useEffect replaces componentDidMount, componentDidUpdate, and componentWillUnmount.',
        timestampSec: 180,
        memoType: 'INSIGHT',
        importance: 5,
      },
      {
        id: 'memo2',
        userId: 'user1',
        videoId: 'video1',
        content: 'Practice implementing a custom hook for API calls. This will help understand the power of reusable logic.',
        timestampSec: 600,
        memoType: 'ACTION',
        importance: 4,
      },
      {
        id: 'memo3',
        userId: 'user1',
        videoId: 'video2',
        content: 'How do conditional types work in complex scenarios? Need to research more about mapped types.',
        timestampSec: 900,
        memoType: 'QUESTION',
        importance: 3,
      }
    ];

    for (const memoData of demoMemos) {
      const memo = await prisma.memo.upsert({
        where: { id: memoData.id },
        update: {},
        create: memoData,
      });
      console.log('✅ Demo memo created:', memo.content.substring(0, 50) + '...');
    }

    // Create demo tags
    const demoTags = [
      {
        id: 'tag1',
        userId: 'user1',
        name: 'React',
        color: '#61DAFB',
      },
      {
        id: 'tag2',
        userId: 'user1',
        name: 'TypeScript',
        color: '#3178C6',
      },
      {
        id: 'tag3',
        userId: 'user1',
        name: 'Frontend',
        color: '#FF6B6B',
      }
    ];

    for (const tagData of demoTags) {
      const tag = await prisma.tag.upsert({
        where: { id: tagData.id },
        update: {},
        create: tagData,
      });
      console.log('✅ Demo tag created:', tag.name);
    }

    // Create demo tasks
    const demoTasks = [
      {
        id: 'task1',
        userId: 'user1',
        memoId: 'memo2',
        title: 'Implement custom useApi hook',
        description: 'Create a reusable hook for API calls based on the React Hooks tutorial',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      },
      {
        id: 'task2',
        userId: 'user1',
        memoId: 'memo3',
        title: 'Research TypeScript mapped types',
        description: 'Deep dive into mapped types and conditional types in TypeScript',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      }
    ];

    for (const taskData of demoTasks) {
      const task = await prisma.task.upsert({
        where: { id: taskData.id },
        update: {},
        create: taskData,
      });
      console.log('✅ Demo task created:', task.title);
    }

    console.log('🎉 Demo data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoData();