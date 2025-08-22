import { NextResponse } from 'next/server';
import { getActiveTasks } from '@/lib/TaskMarketplace';

export async function GET() {
  try {
    const tasks = await getActiveTasks();
    
    return NextResponse.json({ 
      success: true, 
      tasks 
    });

  } catch (error) {
    console.error("Error fetching active tasks:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }, { status: 500 });
  }
} 