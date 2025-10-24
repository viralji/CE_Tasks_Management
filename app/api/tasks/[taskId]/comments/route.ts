import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const orgId = (session as any).org as string;

    // Fetch comments for the task
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      const comments = await client.query(`
        SELECT 
          tc.id,
          tc.content,
          tc.created_at,
          au.name as created_by_user_name,
          au.primary_email as created_by_user_email
        FROM task_comment tc
        LEFT JOIN app_user au ON tc.author_id = au.id
        WHERE tc.task_id = $1 
          AND tc.org_id = $2
        ORDER BY tc.created_at DESC
      `, [taskId, orgId]);

      return NextResponse.json({
        success: true,
        data: comments.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching task comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const orgId = (session as any).org as string;
    const userId = (session as any).user?.id as string;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Insert new comment
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO task_comment (id, org_id, task_id, author_id, content)
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
        RETURNING id, content, created_at
      `, [orgId, taskId, userId, content.trim()]);

      const comment = result.rows[0];

      // Fetch the comment with user details
      const commentWithUser = await client.query(`
        SELECT 
          tc.id,
          tc.content,
          tc.created_at,
          au.name as created_by_user_name,
          au.primary_email as created_by_user_email
        FROM task_comment tc
        LEFT JOIN app_user au ON tc.author_id = au.id
        WHERE tc.id = $1
      `, [comment.id]);

      return NextResponse.json({
        success: true,
        data: commentWithUser.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding task comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}