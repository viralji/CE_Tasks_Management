import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTask, updateTaskStatus, requestTaskClosure, getTaskClosureRequests } from '@/lib/data/tasks';

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const orgId = (session as any).org as string;
  const { taskId } = await params;
  
  try {
    const requests = await getTaskClosureRequests(orgId, taskId);
    return NextResponse.json({ data: requests });
  } catch (error) {
    console.error('Error fetching closure requests:', error);
    return NextResponse.json({ error: 'Failed to fetch closure requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const orgId = (session as any).org as string;
  const { taskId } = await params;
  const userId = (session as any).user?.id as string;
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const { action, status } = body; // action: 'close' | 'request', status: 'DONE' | 'CANCELED'
    
    // Get task to check if user is creator
    const task = await getTask(orgId, taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    if (action === 'close') {
      // Only creator can close
      if (task.created_by !== userId) {
        return NextResponse.json({ error: 'Only task creator can close task' }, { status: 403 });
      }
      
      const updatedTask = await updateTaskStatus(orgId, taskId, status, userId);
      return NextResponse.json({ data: updatedTask });
    } else if (action === 'request') {
      // Anyone can request closure
      const request = await requestTaskClosure(orgId, taskId, userId);
      return NextResponse.json({ data: request });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling task closure:', error);
    return NextResponse.json({ error: 'Failed to handle task closure' }, { status: 500 });
  }
}
