/**
 * AWS S3 utility functions for file operations
 * 
 * @fileoverview S3 integration for file upload, download, and management
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { decryptAwsCredentials } from '../utils/encryption';

/**
 * S3 configuration interface
 */
export interface S3Config {
  accessKey: string;
  secretKey: string;
  region: string;
  bucket: string;
  pathPrefix?: string;
}

/**
 * File upload result interface
 */
export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
  size: number;
}

/**
 * Get S3 client with organization-specific credentials
 * @param orgId - Organization ID
 * @returns Configured S3 client
 */
export const getS3Client = async (orgId: string): Promise<{ client: S3Client; config: S3Config }> => {
  console.log('🔧 getS3Client called with orgId:', orgId, 'type:', typeof orgId);
  
  const { pool } = await import('@/lib/db');
  const client = await pool.connect();
  
  try {
    console.log('🔍 Querying organization_settings for orgId:', orgId);
    
    // Get organization settings
    const result = await client.query(`
      SELECT 
        aws_access_key_encrypted::text,
        aws_secret_key_encrypted::text,
        s3_bucket_name,
        s3_region,
        s3_bucket_path_prefix
      FROM organization_settings 
      WHERE org_id = $1
    `, [orgId]);
    
    console.log('📊 Query result:', {
      rowCount: result.rows.length,
      hasRows: result.rows.length > 0
    });
    
    if (result.rows.length === 0) {
      throw new Error('AWS S3 configuration not found for organization');
    }
    
    const settings = result.rows[0];
    
    console.log('📋 Raw settings from DB:', {
      aws_access_key_encrypted: settings.aws_access_key_encrypted ? 'present' : 'missing',
      aws_secret_key_encrypted: settings.aws_secret_key_encrypted ? 'present' : 'missing',
      s3_bucket_name: settings.s3_bucket_name,
      s3_region: settings.s3_region,
      s3_bucket_path_prefix: settings.s3_bucket_path_prefix
    });
    
    // Get credentials (using pass-through encryption)
    const accessKey = String(settings.aws_access_key_encrypted || '');
    const secretKey = String(settings.aws_secret_key_encrypted || '');
    
    console.log('🔑 S3 Credentials processed:', {
      accessKey: accessKey.substring(0, 10) + '...',
      secretKey: secretKey.substring(0, 10) + '...',
      region: settings.s3_region,
      bucket: settings.s3_bucket_name,
      accessKeyLength: accessKey.length,
      secretKeyLength: secretKey.length,
      accessKeyType: typeof accessKey,
      secretKeyType: typeof secretKey
    });
    
    if (!accessKey || !secretKey) {
      console.error('❌ Missing credentials:', { accessKey: !!accessKey, secretKey: !!secretKey });
      throw new Error('AWS credentials are missing or invalid');
    }
    
    const config: S3Config = {
      accessKey,
      secretKey,
      region: settings.s3_region,
      bucket: settings.s3_bucket_name,
      pathPrefix: settings.s3_bucket_path_prefix || ''
    };
    
    // Create S3 client
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey
      }
    });
    
    return { client: s3Client, config };
  } finally {
    client.release();
  }
};

/**
 * Upload file to S3
 * @param orgId - Organization ID
 * @param taskId - Task ID
 * @param file - File buffer or stream
 * @param filename - Original filename
 * @param contentType - MIME type
 * @returns Upload result with S3 key and URL
 */
export const uploadFile = async (
  orgId: string,
  taskId: string,
  projectName: string,
  file: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> => {
  try {
    console.log('📁 Starting S3 upload:', { 
      orgId, 
      taskId, 
      projectName,
      filename, 
      contentType,
      fileSize: file.length,
      orgIdType: typeof orgId,
      taskIdType: typeof taskId
    });
    
    const { client, config } = await getS3Client(orgId);
    console.log('✅ S3 client created successfully');
    
    // Generate unique key using project name as folder
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = sanitizeFilename(filename);
    const sanitizedProjectName = sanitizeFilename(projectName);
    const key = `${config.pathPrefix}${sanitizedProjectName}/${timestamp}-${randomId}-${sanitizedFilename}`;
    
    console.log('🔑 Generated S3 key:', key);
    
    try {
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        'original-filename': filename,
        'org-id': orgId,
        'task-id': taskId,
        'uploaded-at': new Date().toISOString()
      }
    });
    
    await client.send(command);
    
    return {
      key,
      bucket: config.bucket,
      url: `s3://${config.bucket}/${key}`,
      size: file.length
    };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  } catch (error) {
    console.error('S3 client creation error:', error);
    throw new Error('Failed to create S3 client');
  }
};

/**
 * Generate signed URL for file download
 * @param orgId - Organization ID
 * @param s3Key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default 900 = 15 minutes)
 * @returns Signed URL for file download
 */
export const generateSignedUrl = async (
  orgId: string,
  s3Key: string,
  expiresIn: number = 900
): Promise<string> => {
  const { client } = await getS3Client(orgId);
  
  try {
    const command = new GetObjectCommand({
      Bucket: (await getS3Client(orgId)).config.bucket,
      Key: s3Key
    });
    
    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error('S3 signed URL generation error:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Delete file from S3
 * @param orgId - Organization ID
 * @param s3Key - S3 object key
 * @returns True if deletion was successful
 */
export const deleteFile = async (orgId: string, s3Key: string): Promise<boolean> => {
  const { client, config } = await getS3Client(orgId);
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: s3Key
    });
    
    await client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Check if file exists in S3
 * @param orgId - Organization ID
 * @param s3Key - S3 object key
 * @returns True if file exists
 */
export const fileExists = async (orgId: string, s3Key: string): Promise<boolean> => {
  const { client, config } = await getS3Client(orgId);
  
  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: s3Key
    });
    
    await client.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get file metadata from S3
 * @param orgId - Organization ID
 * @param s3Key - S3 object key
 * @returns File metadata
 */
export const getFileMetadata = async (orgId: string, s3Key: string) => {
  const { client, config } = await getS3Client(orgId);
  
  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: s3Key
    });
    
    const response = await client.send(command);
    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      metadata: response.Metadata
    };
  } catch (error) {
    console.error('S3 metadata error:', error);
    throw new Error('Failed to get file metadata');
  }
};

/**
 * Sanitize filename for safe storage
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path traversal attempts
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Remove multiple consecutive underscores
  const cleaned = sanitized.replace(/_+/g, '_');
  
  // Ensure filename is not empty and has reasonable length
  if (!cleaned || cleaned.length === 0) {
    return `file_${Date.now()}`;
  }
  
  // Limit filename length
  if (cleaned.length > 100) {
    const ext = cleaned.split('.').pop();
    const name = cleaned.substring(0, 100 - (ext ? ext.length + 1 : 0));
    return ext ? `${name}.${ext}` : name;
  }
  
  return cleaned;
};

/**
 * Generate S3 key for organization and task
 * @param orgId - Organization ID
 * @param taskId - Task ID
 * @param filename - Filename
 * @param pathPrefix - Optional path prefix
 * @returns S3 key
 */
export const generateS3Key = (
  orgId: string,
  taskId: string,
  filename: string,
  pathPrefix: string = ''
): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = sanitizeFilename(filename);
  
  return `${pathPrefix}${orgId}/${taskId}/${timestamp}-${randomId}-${sanitizedFilename}`;
};
