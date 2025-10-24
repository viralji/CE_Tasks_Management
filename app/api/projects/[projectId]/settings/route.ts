import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { getProjectSettings, updateProjectSettings } from '@/lib/data/projects';

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { projectId } = await params;
  const orgId = (session as any).org as string;
  
  try {
    const settings = await getProjectSettings(orgId, projectId);
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Error fetching project settings:', error);
    return NextResponse.json({ error: 'Failed to fetch project settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { projectId } = await params;
  const orgId = (session as any).org as string;
  const updates = await req.json();
  
  try {
    const settings = await updateProjectSettings(orgId, projectId, updates);
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return NextResponse.json({ error: 'Failed to update project settings' }, { status: 500 });
  }
}
