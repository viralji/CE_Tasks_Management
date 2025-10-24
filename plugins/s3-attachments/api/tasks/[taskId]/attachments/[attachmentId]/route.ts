/**
 * S3 Attachments API - Individual Attachment Operations
 * 
 * API routes for individual attachment operations (download, delete).
 * 
 * Usage: Copy this file to your-project/app/api/tasks/[taskId]/attachments/[attachmentId]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { S3AttachmentManager } from '@/plugins/s3-attachments/S3AttachmentManager';
import { Pool } from 'pg';

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * GET /api/tasks/[taskId]/attachments/[attachmentId]
 * Generate signed URL for downloading an attachment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, attachmentId } = await params;
    const userId = (session as any).user?.id;
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

    // Get orgId from task
    const taskResult = await pool.query(`
      SELECT org_id FROM task WHERE id = $1
    `, [taskId]);

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const orgId = taskResult.rows[0].org_id;

    // Check task access (implement your access control logic)
    // const hasAccess = await checkTaskAccess(orgId, taskId, userId, isSuperAdmin);
    // if (!hasAccess) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Get project name for folder structure
    const projectResult = await pool.query(`
      SELECT p.name as project_name
      FROM task t
      JOIN project p ON p.id = t.project_id
      WHERE t.id = $1 AND t.org_id = $2
    `, [taskId, orgId]);

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectName = projectResult.rows[0].project_name;

    // Initialize S3 manager
    const attachmentManager = new S3AttachmentManager({
      orgId,
      taskId,
      projectName
    });

    // Get download URL
    const downloadUrl = await attachmentManager.getDownloadUrl(attachmentId);

    return NextResponse.json({
      data: {
        download_url: downloadUrl,
        expires_in: 900 // 15 minutes
      },
      message: 'Download URL generated successfully'
    });

  } catch (error) {
    console.error('❌ GET attachment download URL error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[taskId]/attachments/[attachmentId]
 * Delete an attachment from S3 and database
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, attachmentId } = await params;
    const userId = (session as any).user?.id;
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

    // Get orgId from task
    const taskResult = await pool.query(`
      SELECT org_id FROM task WHERE id = $1
    `, [taskId]);

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const orgId = taskResult.rows[0].org_id;

    // Check task access (implement your access control logic)
    // const hasAccess = await checkTaskAccess(orgId, taskId, userId, isSuperAdmin);
    // if (!hasAccess) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Get project name for folder structure
    const projectResult = await pool.query(`
      SELECT p.name as project_name
      FROM task t
      JOIN project p ON p.id = t.project_id
      WHERE t.id = $1 AND t.org_id = $2
    `, [taskId, orgId]);

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectName = projectResult.rows[0].project_name;

    // Initialize S3 manager
    const attachmentManager = new S3AttachmentManager({
      orgId,
      taskId,
      projectName
    });

    // Delete file
    await attachmentManager.deleteFile(attachmentId);

    return NextResponse.json({
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('❌ DELETE attachment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
