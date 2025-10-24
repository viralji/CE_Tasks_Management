/**
 * Unread Mentions API Route
 * 
 * Handles fetching the count of unread @mentions for the current user.
 * Used to display notification badges in the UI.
 * 
 * @fileoverview API endpoint for unread mention count
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserUnreadMentions } from '@/lib/data/chat';

/**
 * GET /api/chat/mentions/unread
 * 
 * Fetches the count of unread @mentions for the current user.
 * This includes mentions across all projects and chat rooms.
 * 
 * @param req - NextRequest object
 * @returns JSON response with unread mention count or error
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).org as string;
    const userId = (session as any).user?.id as string;
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Missing organization or user context' }, { status: 400 });
    }

    // Get unread mention count for the user
    const unreadCount = await getUserUnreadMentions(orgId, userId, isSuperAdmin);

    return NextResponse.json({ 
      data: { 
        unreadCount 
      } 
    });

  } catch (error) {
    console.error('Error fetching unread mentions:', error);
    return NextResponse.json({ error: 'Failed to fetch unread mentions' }, { status: 500 });
  }
}
