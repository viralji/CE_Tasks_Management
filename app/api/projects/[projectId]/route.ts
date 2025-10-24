import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getProject, updateProject, checkProjectAccess, deleteProject } from '@/lib/data/projects';
import { listProjectMembers } from '@/lib/data/members';
import { getTasksByStatus } from '@/lib/data/tasks';

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
  
  try {
    // Get project details
    const project = await getProject(orgId, projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get project members
    const members = await listProjectMembers(orgId, projectId);
    
    // Get tasks grouped by status
    const tasks = await getTasksByStatus(orgId, projectId, userId, isSuperAdmin);
    const taskCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      BLOCKED: 0,
      DONE: 0,
      CANCELED: 0
    };
    
    for (const task of tasks) {
      taskCounts[task.status as keyof typeof taskCounts]++;
    }
    
    return NextResponse.json({
      data: {
        project,
        members,
        taskCounts,
        tasks: tasks.slice(0, 20) // Limit for performance
      }
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json({ error: 'Failed to fetch project details' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
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
  
  try {
    const body = await req.json();
    const {
      name,
      slug,
      startAt,
      endAt,
      severity,
      status,
      description
    } = body;
    
    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }
    
    // Update project
    const updatedProject = await updateProject(orgId, projectId, {
      name,
      startAt: startAt || null,
      endAt: endAt || null,
      severity: severity || 'MEDIUM',
      status: status || 'ACTIVE',
      description: description || null
    });
    
    return NextResponse.json({ data: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { projectId } = await params;
  const orgId = (session as any).org as string;
  const userId = (session as any).user?.id as string;
  const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

  // Only super admin can delete projects
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden: Only super admin can delete projects' }, { status: 403 });
  }

  // Check access
  const hasAccess = await checkProjectAccess(orgId, projectId, userId, isSuperAdmin);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden: You are not a member of this project' }, { status: 403 });
  }
  
  try {
    // Delete project (this will cascade delete related data)
    await deleteProject(orgId, projectId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Project deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
