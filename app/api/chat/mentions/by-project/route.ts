/**
 * Get Mentions by Project API Route
 * 
 * Returns mention counts grouped by project for the current user.
 * Used to display mention badges on project cards in the projects list.
 * 
 * @fileoverview API endpoint for getting mentions grouped by project
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserMentionsByProject } from '@/lib/data/chat';

/**
 * GET /api/chat/mentions/by-project
 * 
 * Fetches mention counts grouped by project for the authenticated user.
 * Returns projects with unread mention counts.
 * 
 * @param req - NextRequest object
 * @returns JSON response with project mention data
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = (session as any).org as string;
  const userId = (session as any).user?.id as string;
  const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

  try {
    const projectMentions = await getUserMentionsByProject(orgId, userId, isSuperAdmin);
    return NextResponse.json({ data: { projectMentions } });
  } catch (error) {
    console.error('Error fetching mentions by project:', error);
    return NextResponse.json({ error: 'Failed to fetch mentions by project' }, { status: 500 });
  }
}
