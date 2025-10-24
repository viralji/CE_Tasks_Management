import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { getTasksByStatus, createTask, assignUsersToTask } from '@/lib/data/tasks';
import { getProjectSettings, checkProjectAccess } from '@/lib/data/projects';

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { projectId } = await params;
  const orgId = (session as any).org as string;
  const userId = (session as any).user?.id as string;
  const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

  // Check access
  const hasAccess = await checkProjectAccess(orgId, projectId, userId, isSuperAdmin);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden: You are not a member of this project' }, { status: 403 });
  }
  
  console.log('Task listing API:', { projectId, orgId });
  
  try {
    const tasks = await getTasksByStatus(orgId, projectId, userId, isSuperAdmin);
    console.log('Tasks found:', tasks);
    const grouped = { OPEN: [], IN_PROGRESS: [], BLOCKED: [], DONE: [], CANCELED: [] } as Record<string, any[]>;
    for (const t of tasks) grouped[t.status]?.push(t);
    console.log('Grouped tasks:', grouped);
    return NextResponse.json({ data: grouped });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { projectId } = await params;
  const orgId = (session as any).org as string;
  const userId = (session as any).user?.id as string;
  const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

  // Check access
  const hasAccess = await checkProjectAccess(orgId, projectId, userId, isSuperAdmin);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden: You are not a member of this project' }, { status: 403 });
  }
  
  console.log('Task creation API:', { projectId, orgId, userId });
  
  try {
    const body = await req.json();
    const { title, description, priority, dueAt, status, assignedTo } = body;
    console.log('Task creation body:', { title, description, priority, dueAt, status, assignedTo });
    
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    
    if (!assignedTo) {
      return NextResponse.json({ error: 'assignedTo is required' }, { status: 400 });
    }
    
    // Fetch project settings
    const settings = await getProjectSettings(orgId, projectId);
    
    // Apply defaults if not provided
    const finalPriority = priority || settings.defaultTaskPriority;
    const finalStatus = status || 'OPEN'; // Use valid enum value
    const finalDueAt = dueAt || (
      settings.defaultTaskDueDays > 0
        ? new Date(Date.now() + settings.defaultTaskDueDays * 24 * 60 * 60 * 1000).toISOString()
        : null
    );
    
    const task = await createTask(orgId, projectId, title, description, finalPriority, finalDueAt, userId, finalStatus);
    console.log('Task created:', task);
    
    // Assign the specified user
    await assignUsersToTask(orgId, task.id, [assignedTo]);
    
    return NextResponse.json({ data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}


