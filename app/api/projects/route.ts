import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { listProjects, createProject } from '@/lib/data/projects';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const orgId = (session as any).org as string;
  const userId = (session as any).user?.id as string;
  const isSuperAdmin = (session as any).user?.isSuperAdmin === true;
  
  const { searchParams } = new URL(req.url);
  const statusFilter = (searchParams.get('status') || 'open') as 'open' | 'closed' | 'all';
  
  try {
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      // Fetch all projects with access information
      // Super admin sees all projects, regular users see only projects they're members of
      let query, params;
      if (isSuperAdmin) {
        query = `
          SELECT p.*, true as has_access
          FROM project p
          WHERE p.org_id = $1
          ORDER BY p.created_at DESC
        `;
        params = [orgId];
      } else {
        query = `
          SELECT p.*, 
            CASE WHEN pm.user_id IS NOT NULL THEN true ELSE false END as has_access
          FROM project p
          LEFT JOIN project_member pm ON p.id = pm.project_id AND pm.user_id = $2
          WHERE p.org_id = $1
          ORDER BY p.created_at DESC
        `;
        params = [orgId, userId];
      }
      
      const { rows } = await client.query(query, params);
      
      // Filter by status if needed
      let filteredProjects = rows;
      if (statusFilter === 'open') {
        filteredProjects = rows.filter(p => p.status === 'ACTIVE');
      } else if (statusFilter === 'closed') {
        filteredProjects = rows.filter(p => p.status !== 'ACTIVE');
      }
      
      return NextResponse.json({ data: filteredProjects });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const orgId = (session as any).org as string;
  const userId = (session as any).user?.id as string;
  
  // Handle both JSON and form data
  let body: any;
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await req.json();
  } else {
    const formData = await req.formData();
    body = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      parentId: formData.get('parentId'),
      startAt: formData.get('startAt'),
      endAt: formData.get('endAt'),
      severity: formData.get('severity'),
      status: formData.get('status'),
      description: formData.get('description'),
    };
  }
  
  const { 
    name, slug, parentId, 
    startAt, endAt, severity, status, description,
    settings 
  } = body;
  
  if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 });
  
  const project = await createProject(orgId, {
    name, slug, parentId,
    startAt, endAt, severity, status, description,
    createdBy: userId,
    settings
  });
  
  return NextResponse.json({ data: project });
}


