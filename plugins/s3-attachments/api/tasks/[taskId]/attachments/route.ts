/**
 * S3 Attachments API - Modular Plugin
 * 
 * Complete API routes for S3 file attachments with multi-tenant support.
 * 
 * Usage: Copy this file to your-project/app/api/tasks/[taskId]/attachments/route.ts
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

    // List attachments
    const attachments = await attachmentManager.listAttachments();

    return NextResponse.json({
      data: attachments,
      message: 'Attachments retrieved successfully'
    });

  } catch (error) {
    console.error('❌ GET attachments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

/**
 * POST /api/tasks/[taskId]/attachments
 * Upload a new file attachment
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get organization settings for validation
    const settingsResult = await pool.query(`
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

    // Validate file type
    if (allowed_file_types && allowed_file_types.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowed_file_types.includes(`.${fileExtension}`)) {
        return NextResponse.json({ 
          error: `File type not allowed. Allowed types: ${allowed_file_types.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Initialize S3 manager
    const attachmentManager = new S3AttachmentManager({
      orgId,
      taskId,
      projectName,
      maxFileSize: max_file_size_mb,
      allowedTypes: allowed_file_types
    });

    // Upload file
    const result = await attachmentManager.uploadFile(file);

    return NextResponse.json({
      data: result,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('❌ POST attachment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
