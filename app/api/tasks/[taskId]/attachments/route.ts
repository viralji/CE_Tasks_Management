/**
 * Task Attachments API
 * 
 * @fileoverview API for managing file attachments on tasks
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
import { uploadFile, generateSignedUrl } from '@/lib/aws/s3';
import { errorHandler } from '@/lib/utils/errorHandler';
import { checkTaskAccess } from '@/lib/data/tasks';

/**
 * GET /api/tasks/[taskId]/attachments
 * List all attachments for a task
 */
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
    const userId = (session as any).user?.id;
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

    const client = await pool.connect();
    try {
      // Get task and organization info
      const taskResult = await client.query(`
        SELECT t.org_id, t.title as task_title
        FROM task t
        WHERE t.id = $1 AND t.deleted_at IS NULL
      `, [taskId]);

      if (taskResult.rows.length === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const { org_id: orgId, task_title } = taskResult.rows[0];

      // Check task access
      const hasAccess = await checkTaskAccess(orgId, taskId, userId, isSuperAdmin);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get attachments with user info
      const attachmentsResult = await client.query(`
        SELECT 
          ta.id,
          ta.filename,
          ta.original_filename,
          ta.file_size,
          ta.file_type,
          ta.s3_key,
          ta.s3_bucket,
          ta.uploaded_at,
          u.name as uploaded_by_name,
          u.primary_email as uploaded_by_email
        FROM task_attachment ta
        JOIN app_user u ON u.id = ta.uploaded_by
        WHERE ta.task_id = $1 
          AND ta.org_id = $2
          AND ta.deleted_at IS NULL
        ORDER BY ta.uploaded_at DESC
      `, [taskId, orgId]);

      const attachments = attachmentsResult.rows.map(attachment => ({
        id: attachment.id,
        filename: attachment.filename,
        original_filename: attachment.original_filename,
        file_size: attachment.file_size,
        file_type: attachment.file_type,
        uploaded_at: attachment.uploaded_at,
        uploaded_by_name: attachment.uploaded_by_name,
        uploaded_by_email: attachment.uploaded_by_email,
        // Generate signed URL for download
        download_url: null // Will be generated on demand
      }));

      return NextResponse.json({
        data: {
          task_id: taskId,
          task_title,
          attachments,
          count: attachments.length
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    const { taskId } = await params;
    errorHandler.handleError(error as Error, { context: 'GET task attachments', taskId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tasks/[taskId]/attachments
 * Upload a new file attachment to a task
 */
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
    const userId = (session as any).user?.id;
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

    const client = await pool.connect();
    try {
      // Get task and organization info
      const taskResult = await client.query(`
        SELECT t.org_id, t.title as task_title
        FROM task t
        WHERE t.id = $1 AND t.deleted_at IS NULL
      `, [taskId]);

      if (taskResult.rows.length === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const { org_id: orgId } = taskResult.rows[0];

      // Check task access
      const hasAccess = await checkTaskAccess(orgId, taskId, userId, isSuperAdmin);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Get organization settings for file size limits
      const settingsResult = await client.query(`
        SELECT max_file_size_mb, allowed_file_types
        FROM organization_settings
        WHERE org_id = $1
      `, [orgId]);

      if (settingsResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'AWS S3 configuration not found for organization' 
        }, { status: 400 });
      }

      const { max_file_size_mb, allowed_file_types } = settingsResult.rows[0];
      const maxSizeBytes = max_file_size_mb * 1024 * 1024;

      // Validate file size
      if (file.size > maxSizeBytes) {
        return NextResponse.json({ 
          error: `File size exceeds limit of ${max_file_size_mb}MB` 
        }, { status: 400 });
      }

      // Validate file type if restrictions exist
      if (allowed_file_types && allowed_file_types.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowed_file_types.includes(`.${fileExtension}`)) {
          return NextResponse.json({ 
            error: `File type not allowed. Allowed types: ${allowed_file_types.join(', ')}` 
          }, { status: 400 });
        }
      }

      // Get project name for S3 folder
      const projectResult = await client.query(`
        SELECT p.name as project_name
        FROM task t
        JOIN project p ON p.id = t.project_id
        WHERE t.id = $1 AND t.org_id = $2
      `, [taskId, orgId]);

      if (projectResult.rows.length === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const projectName = projectResult.rows[0].project_name;

      // Convert file to buffer
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      console.log('📁 File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        bufferLength: fileBuffer.length,
        orgId,
        taskId,
        projectName
      });

      // Upload file to S3
      console.log('🚀 Calling uploadFile with:', {
        orgId,
        taskId,
        projectName,
        filename: file.name,
        contentType: file.type,
        fileSize: fileBuffer.length
      });
      
      const uploadResult = await uploadFile(
        orgId,
        taskId,
        projectName,
        fileBuffer,
        file.name,
        file.type
      );
      
      console.log('✅ S3 upload successful:', uploadResult);

      // Save attachment record to database
      const insertResult = await client.query(`
        INSERT INTO task_attachment (
          org_id,
          task_id,
          filename,
          original_filename,
          file_size,
          file_type,
          s3_key,
          s3_bucket,
          uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, uploaded_at
      `, [
        orgId,
        taskId,
        uploadResult.key.split('/').pop() || file.name, // filename
        file.name, // original_filename
        file.size,
        file.type,
        uploadResult.key,
        uploadResult.bucket,
        userId
      ]);

      // Get user info for response
      const userResult = await client.query(`
        SELECT name, primary_email FROM app_user WHERE id = $1
      `, [userId]);

      const user = userResult.rows[0];

      return NextResponse.json({
        data: {
          id: insertResult.rows[0].id,
          filename: uploadResult.key.split('/').pop() || file.name,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: insertResult.rows[0].uploaded_at,
          uploaded_by_name: user.name,
          uploaded_by_email: user.primary_email,
          s3_key: uploadResult.key,
          s3_bucket: uploadResult.bucket
        },
        message: 'File uploaded successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    const { taskId } = await params;
    
    console.error('💥 POST task attachment error:', {
      error: error,
      message: (error as Error).message,
      stack: (error as Error).stack,
      taskId,
      timestamp: new Date().toISOString()
    });
    
    errorHandler.handleError(error as Error, { context: 'POST task attachment', taskId });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
