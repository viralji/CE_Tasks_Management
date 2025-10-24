/**
 * Mark Mentions as Read API Route
 * 
 * Handles marking @mentions as read for the current user.
 * Used when a user views a chat room to clear mention notifications.
 * 
 * @fileoverview API endpoint for marking mentions as read
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markMentionsAsRead } from '@/lib/data/chat';

/**
 * POST /api/chat/mentions/mark-read
 * 
 * Marks @mentions as read for the current user.
 * Can mark specific message mentions or all mentions in a room.
 * 
 * @param req - NextRequest object
 * @returns JSON response with success status or error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).org as string;
    const userId = (session as any).user?.id as string;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Missing organization or user context' }, { status: 400 });
    }

    const body = await req.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Mark mentions as read for the specific message
    await markMentionsAsRead(orgId, messageId, userId);

    return NextResponse.json({ 
      data: { 
        success: true 
      },
      message: 'Mentions marked as read' 
    });

  } catch (error) {
    console.error('Error marking mentions as read:', error);
    return NextResponse.json({ error: 'Failed to mark mentions as read' }, { status: 500 });
  }
}
