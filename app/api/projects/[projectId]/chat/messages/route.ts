/**
 * Project Chat Messages API Route
 * 
 * Handles fetching and sending messages for a project's chat room.
 * Supports @mentions and real-time message updates.
 * 
 * @fileoverview API endpoint for project chat messages
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getOrCreateChatRoom, 
  getChatMessagesWithMentions, 
  sendMessage, 
  markAsRead 
} from '@/lib/data/chat';
import { checkProjectAccess } from '@/lib/data/projects';

/**
 * GET /api/projects/[projectId]/chat/messages
 * 
 * Fetches all messages for a project's chat room with mention information.
 * 
 * @param req - NextRequest object
 * @param params - Route parameters containing projectId
 * @returns JSON response with messages or error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const orgId = (session as any).org as string;
    const userId = (session as any).user?.id as string;
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Missing organization or user context' }, { status: 400 });
    }

    // Check project access
    const hasAccess = await checkProjectAccess(orgId, projectId, userId, isSuperAdmin);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this project' }, { status: 403 });
    }

    // Get or create chat room for the project
    const chatRoom = await getOrCreateChatRoom(orgId, projectId);
    if (!chatRoom) {
      return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
    }

    // Get messages with mention information
    const messages = await getChatMessagesWithMentions(orgId, chatRoom.id, userId);

    // Mark room as read for this user
    await markAsRead(orgId, chatRoom.id, userId);

    return NextResponse.json({ 
      data: { 
        roomId: chatRoom.id,
        messages 
      } 
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[projectId]/chat/messages
 * 
 * Sends a new message to the project's chat room.
 * Automatically processes @mentions and creates mention records.
 * 
 * @param req - NextRequest object
 * @param params - Route parameters containing projectId
 * @returns JSON response with created message or error
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const orgId = (session as any).org as string;
    const userId = (session as any).user?.id as string;
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Missing organization or user context' }, { status: 400 });
    }

    // Check project access
    const hasAccess = await checkProjectAccess(orgId, projectId, userId, isSuperAdmin);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this project' }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Get or create chat room for the project
    const chatRoom = await getOrCreateChatRoom(orgId, projectId);
    if (!chatRoom) {
      return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
    }

    // Send the message (this will also process @mentions)
    const message = await sendMessage(orgId, chatRoom.id, userId, content.trim());

    return NextResponse.json({ 
      data: { 
        message,
        roomId: chatRoom.id
      },
      message: 'Message sent successfully' 
    });

  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
