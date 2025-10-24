import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { assignUsersToTask, getTaskAssignments } from '@/lib/data/tasks';

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const orgId = (session as any).org as string;
  const { taskId } = await params;
  
  try {
    const assignments = await getTaskAssignments(orgId, taskId);
    return NextResponse.json({ data: assignments });
  } catch (error) {
    console.error('Error fetching task assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const orgId = (session as any).org as string;
  const { taskId } = await params;
  
  try {
    const body = await req.json();
    const { userIds } = body;
    
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 });
    }
    
    await assignUsersToTask(orgId, taskId, userIds);
    
    // Return updated assignments
    const assignments = await getTaskAssignments(orgId, taskId);
    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error assigning users to task:', error);
    return NextResponse.json({ error: 'Failed to assign users' }, { status: 500 });
  }
}
