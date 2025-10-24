/**
 * Mark All Room Mentions as Read API Route
 * 
 * Marks all mentions in a specific chat room as read for the current user.
 * This is called when a user sends a message in a chat room to clear
 * all their unread mentions in that room.
 * 
 * @fileoverview API endpoint for marking room mentions as read
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { markAllRoomMentionsAsRead } from '@/lib/data/chat';

/**
 * POST /api/chat/mentions/mark-read-room
 * 
 * Marks all mentions in a chat room as read for the authenticated user.
 * 
 * @param req - NextRequest object containing roomId in body
 * @returns JSON response with success status
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = (session as any).org as string;
  const userId = (session as any).user?.id as string;
  const { roomId } = await req.json();

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }

  try {
    await markAllRoomMentionsAsRead(orgId, roomId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking room mentions as read:', error);
    return NextResponse.json({ error: 'Failed to mark mentions as read' }, { status: 500 });
  }
}
