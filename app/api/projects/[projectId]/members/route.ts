import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkProjectAccess } from '@/lib/data/projects';

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
  const { searchParams } = new URL(req.url);
  const available = searchParams.get('available') === 'true';
  
  try {
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      if (available) {
        // Return users who are NOT already members of this project
        const { rows } = await client.query(`
          SELECT 
            u.id,
            u.name,
            u.primary_email
          FROM app_user u
          JOIN user_organization om ON u.id = om.user_id
          WHERE om.org_id = $1 
          AND u.id NOT IN (
            SELECT pm.user_id FROM project_member pm 
            WHERE pm.org_id = $1 AND pm.project_id = $2
          )
          ORDER BY u.name ASC
        `, [orgId, projectId]);
        
        return NextResponse.json({ data: rows });
      } else {
        // Return current project members
        const { rows } = await client.query(`
          SELECT 
            pm.user_id as id,
            au.name,
            au.primary_email,
            pm.role,
            pm.added_at
          FROM project_member pm
          JOIN app_user au ON pm.user_id = au.id
          WHERE pm.org_id = $1 AND pm.project_id = $2
          ORDER BY pm.added_at DESC
        `, [orgId, projectId]);
        
        return NextResponse.json({ data: rows });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching project members:', error);
    return NextResponse.json({ error: 'Failed to fetch project members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { projectId } = await params;
  const orgId = (session as any).org as string;
  
  try {
    const body = await req.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      // Check if user is already a member
      const existingMember = await client.query(`
        SELECT user_id FROM project_member 
        WHERE org_id = $1 AND project_id = $2 AND user_id = $3
      `, [orgId, projectId, userId]);
      
      if (existingMember.rows.length > 0) {
        return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 });
      }
      
      // Add user to project and all descendant projects
      const { addUserToProjectAndDescendants } = await import('@/lib/data/project-hierarchy');
      await addUserToProjectAndDescendants(orgId, projectId, userId, 'VIEWER');
      
      return NextResponse.json({ 
        data: { 
          user_id: userId,
          message: 'User added to project and all descendant projects successfully' 
        } 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding project member:', error);
    return NextResponse.json({ error: 'Failed to add user to project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { projectId } = await params;
  const orgId = (session as any).org as string;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  
  try {
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      // Remove user from project and all descendant projects
      const { removeUserFromProjectAndDescendants } = await import('@/lib/data/project-hierarchy');
      await removeUserFromProjectAndDescendants(orgId, projectId, userId);
      
      return NextResponse.json({ 
        data: { 
          message: 'User removed from project and all descendant projects successfully' 
        } 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error removing project member:', error);
    return NextResponse.json({ error: 'Failed to remove user from project' }, { status: 500 });
  }
}