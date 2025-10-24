import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTaskStatusLog } from '@/lib/data/tasks';

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const orgId = (session as any).org as string;
  const { taskId } = await params;
  
  try {
    const log = await getTaskStatusLog(orgId, taskId);
    return NextResponse.json({ data: log });
  } catch (error) {
    console.error('Error fetching task status log:', error);
    return NextResponse.json({ error: 'Failed to fetch status log' }, { status: 500 });
  }
}
