/**
 * Organization Settings API
 * 
 * @fileoverview API for managing AWS S3 settings per organization
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
import { encryptAwsCredentials } from '@/lib/utils/encryption';
import { errorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/admin/organizations/[orgId]/settings
 * Retrieve AWS settings for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    
    // Check if user is super admin
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      // Get organization settings
      const result = await client.query(`
        SELECT 
          id,
          org_id,
          s3_bucket_name,
          s3_region,
          s3_bucket_path_prefix,
          max_file_size_mb,
          allowed_file_types,
          created_at,
          updated_at
        FROM organization_settings 
        WHERE org_id = $1
      `, [orgId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ 
          data: null,
          message: 'No settings found for organization'
        });
      }

      const settings = result.rows[0];
      
      // Get organization name
      const orgResult = await client.query(`
        SELECT name FROM organization WHERE id = $1
      `, [orgId]);
      
      const orgName = orgResult.rows[0]?.name || 'Unknown Organization';

      return NextResponse.json({
        data: {
          ...settings,
          organization_name: orgName,
          // Don't return encrypted credentials in GET response
          aws_access_key_encrypted: undefined,
          aws_secret_key_encrypted: undefined
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    errorHandler.handleError(error as Error, { context: 'GET organization settings', orgId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/organizations/[orgId]/settings
 * Create or update AWS settings for an organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    
    // Check if user is super admin
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      aws_access_key,
      aws_secret_key,
      s3_bucket_name,
      s3_region = 'us-east-1',
      s3_bucket_path_prefix = '',
      max_file_size_mb = 50,
      allowed_file_types = null
    } = body;

    // Validate required fields
    if (!aws_access_key || !aws_secret_key || !s3_bucket_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: aws_access_key, aws_secret_key, s3_bucket_name' 
      }, { status: 400 });
    }

    // Validate file size limit
    if (max_file_size_mb < 1 || max_file_size_mb > 1000) {
      return NextResponse.json({ 
        error: 'File size limit must be between 1MB and 1000MB' 
      }, { status: 400 });
    }

    // For now, use dummy encrypted data to test the save functionality
    const accessKeyEncrypted = 'dummy-encrypted-access-key';
    const secretKeyEncrypted = 'dummy-encrypted-secret-key';

    const client = await pool.connect();
    try {
      // Check if organization exists
      const orgResult = await client.query(`
        SELECT id FROM organization WHERE id = $1
      `, [orgId]);
      
      if (orgResult.rows.length === 0) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      // Check if settings already exist
      const existingResult = await client.query(`
        SELECT id FROM organization_settings WHERE org_id = $1
      `, [orgId]);

      const userId = (session as any).user?.id;

      if (existingResult.rows.length > 0) {
        // Update existing settings
        const updateResult = await client.query(`
          UPDATE organization_settings SET
            aws_access_key_encrypted = $2,
            aws_secret_key_encrypted = $3,
            s3_bucket_name = $4,
            s3_region = $5,
            s3_bucket_path_prefix = $6,
            max_file_size_mb = $7,
            allowed_file_types = $8,
            updated_by = $9,
            updated_at = NOW()
          WHERE org_id = $1
          RETURNING id, created_at, updated_at
        `, [
          orgId,
          accessKeyEncrypted,
          secretKeyEncrypted,
          s3_bucket_name,
          s3_region,
          s3_bucket_path_prefix,
          max_file_size_mb,
          allowed_file_types,
          userId
        ]);

        return NextResponse.json({
          data: {
            id: updateResult.rows[0].id,
            org_id: orgId,
            s3_bucket_name,
            s3_region,
            s3_bucket_path_prefix,
            max_file_size_mb,
            allowed_file_types,
            created_at: updateResult.rows[0].created_at,
            updated_at: updateResult.rows[0].updated_at
          },
          message: 'AWS settings updated successfully'
        });
      } else {
        // Create new settings
        const insertResult = await client.query(`
          INSERT INTO organization_settings (
            org_id,
            aws_access_key_encrypted,
            aws_secret_key_encrypted,
            s3_bucket_name,
            s3_region,
            s3_bucket_path_prefix,
            max_file_size_mb,
            allowed_file_types,
            created_by,
            updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, created_at, updated_at
        `, [
          orgId,
          accessKeyEncrypted,
          secretKeyEncrypted,
          s3_bucket_name,
          s3_region,
          s3_bucket_path_prefix,
          max_file_size_mb,
          allowed_file_types,
          userId,
          userId
        ]);

        return NextResponse.json({
          data: {
            id: insertResult.rows[0].id,
            org_id: orgId,
            s3_bucket_name,
            s3_region,
            s3_bucket_path_prefix,
            max_file_size_mb,
            allowed_file_types,
            created_at: insertResult.rows[0].created_at,
            updated_at: insertResult.rows[0].updated_at
          },
          message: 'AWS settings created successfully'
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    const { orgId } = await params;
    errorHandler.handleError(error as Error, { context: 'POST organization settings', orgId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
