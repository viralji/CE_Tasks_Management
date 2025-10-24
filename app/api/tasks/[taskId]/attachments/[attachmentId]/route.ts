/**
 * Individual Task Attachment API
 * 
 * @fileoverview API for downloading and deleting individual attachments
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
import { generateSignedUrl, deleteFile } from '@/lib/aws/s3';
import { errorHandler } from '@/lib/utils/errorHandler';
import { checkTaskAccess } from '@/lib/data/tasks';

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

    // Get orgId from task first
    const taskResult = await pool.query(`
      SELECT org_id FROM task WHERE id = $1
    `, [taskId]);

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const orgId = taskResult.rows[0].org_id;

    // Check task access
    const hasAccess = await checkTaskAccess(orgId, taskId, userId, isSuperAdmin);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      // Get attachment details
      const attachmentResult = await client.query(`
        SELECT 
          ta.id,
          ta.filename,
          ta.original_filename,
          ta.file_size,
          ta.file_type,
          ta.s3_key,
          ta.s3_bucket,
          ta.org_id,
          ta.uploaded_at,
          u.name as uploaded_by_name
        FROM task_attachment ta
        JOIN app_user u ON u.id = ta.uploaded_by
        WHERE ta.id = $1 
          AND ta.task_id = $2
          AND ta.deleted_at IS NULL
      `, [attachmentId, taskId]);

      if (attachmentResult.rows.length === 0) {
        return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
      }

      const attachment = attachmentResult.rows[0];

      // Generate signed download URL
      const downloadUrl = await generateSignedUrl(
        attachment.org_id,
        attachment.s3_key
      );
      
      console.log('🔗 Real S3 download URL:', downloadUrl);

      return NextResponse.json({
        data: {
          id: attachment.id,
          filename: attachment.filename,
          original_filename: attachment.original_filename,
          file_size: attachment.file_size,
          file_type: attachment.file_type,
          download_url: downloadUrl,
          uploaded_at: attachment.uploaded_at,
          uploaded_by_name: attachment.uploaded_by_name,
          expires_in: 900 // 15 minutes
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    const { taskId } = await params;
    const { attachmentId } = await params;
    errorHandler.handleError(error as Error, { 
      context: 'GET attachment download URL', 
      taskId, 
      attachmentId 
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Get orgId from task first
    const taskResult = await pool.query(`
      SELECT org_id FROM task WHERE id = $1
    `, [taskId]);

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const orgId = taskResult.rows[0].org_id;

    // Check task access
    const hasAccess = await checkTaskAccess(orgId, taskId, userId, isSuperAdmin);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('🗑️ Starting delete attachment:', { taskId, attachmentId, orgId });

    const client = await pool.connect();
    try {
      // Get attachment details
      const attachmentResult = await client.query(`
        SELECT 
          ta.id,
          ta.s3_key,
          ta.org_id,
          ta.uploaded_by
        FROM task_attachment ta
        WHERE ta.id = $1 
          AND ta.task_id = $2
          AND ta.deleted_at IS NULL
      `, [attachmentId, taskId]);

      console.log('📋 Attachment query result:', {
        found: attachmentResult.rows.length > 0,
        attachmentId,
        taskId
      });

      if (attachmentResult.rows.length === 0) {
        return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
      }

      const attachment = attachmentResult.rows[0];

      // Check if user can delete (uploaded by them or super admin)
      if (!isSuperAdmin && attachment.uploaded_by !== userId) {
        return NextResponse.json({ 
          error: 'You can only delete your own attachments' 
        }, { status: 403 });
      }

      // Delete file from S3
      await deleteFile(attachment.org_id, attachment.s3_key);
      console.log('🗑️ Real S3 delete for:', attachment.s3_key);

      // Soft delete from database
      await client.query(`
        UPDATE task_attachment 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [attachmentId]);

      return NextResponse.json({
        message: 'Attachment deleted successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    const { taskId } = await params;
    const { attachmentId } = await params;
    errorHandler.handleError(error as Error, { 
      context: 'DELETE attachment', 
      taskId, 
      attachmentId 
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
