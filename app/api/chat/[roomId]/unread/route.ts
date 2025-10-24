import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUnreadCount } from '@/lib/data/chat';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const orgId = (session as any).org as string;
  const { roomId } = await params;
  const userId = (session as any).user?.id as string;
  
  try {
    const count = await getUnreadCount(orgId, roomId, userId);
    return NextResponse.json({ data: { count } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
