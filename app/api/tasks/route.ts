import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { createTask } from '@/lib/data/tasks';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const orgId = (session as any).org as string;
  const body = await req.json();
  const projectId = (body?.projectId as string) || '';
  const title = (body?.title as string) || '';
  if (!projectId || !title) return NextResponse.json({ error: 'projectId and title required' }, { status: 400 });
  const row = await createTask(orgId, projectId, title);
  return NextResponse.json({ data: row });
}


