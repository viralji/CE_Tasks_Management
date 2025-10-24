/**
 * S3 Attachment Manager - Modular Plugin
 * 
 * A complete, self-contained S3 file attachment system for Next.js applications.
 * Features multi-tenant support, encrypted credentials, and comprehensive error handling.
 * 
 * @author Your Name
 * @version 1.0.0
 * @license MIT
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Pool } from 'pg';

// Types
export interface S3AttachmentManagerOptions {
  orgId: string;
  taskId: string;
  projectName: string;
  maxFileSize?: number;
  allowedTypes?: string[];
}

export interface UploadResult {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  fileType: string;
  s3Key: string;
  s3Bucket: string;
  uploadedAt: Date;
  uploadedByName: string;
  uploadedByEmail: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  uploadedByName: string;
  uploadedByEmail: string;
  downloadUrl?: string;
}

export interface S3Config {
  accessKey: string;
  secretKey: string;
  region: string;
  bucket: string;
  pathPrefix: string;
}

export interface OrganizationSettings {
  aws_access_key_encrypted: string;
  aws_secret_key_encrypted: string;
  s3_bucket_name: string;
  s3_region: string;
  s3_bucket_path_prefix: string;
  max_file_size_mb: number;
  allowed_file_types: string[];
}

/**
 * S3 Attachment Manager Class
 * 
 * Provides a complete interface for managing S3 file attachments with:
 * - Multi-tenant support
 * - Encrypted credential storage
 * - Project-based folder organization
 * - Comprehensive error handling
 * - TypeScript support
 */
export class S3AttachmentManager {
  private orgId: string;
  private taskId: string;
  private projectName: string;
  private maxFileSize: number;
  private allowedTypes: string[];
  private pool: Pool;
  private s3Client: S3Client | null = null;
  private s3Config: S3Config | null = null;

  constructor(options: S3AttachmentManagerOptions) {
    this.orgId = options.orgId;
    this.taskId = options.taskId;
    this.projectName = options.projectName;
    this.maxFileSize = options.maxFileSize || 50; // MB
    this.allowedTypes = options.allowedTypes || [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', 
      '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'
    ];
    
    // Initialize database pool
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  /**
   * Get S3 client with organization-specific credentials
   */
  private async getS3Client(): Promise<{ client: S3Client; config: S3Config }> {
    if (this.s3Client && this.s3Config) {
      return { client: this.s3Client, config: this.s3Config };
    }

    console.log('🔧 S3AttachmentManager: Getting S3 client for orgId:', this.orgId);
    
    const client = await this.pool.connect();
    
    try {
      // Get organization settings
      const result = await client.query(`
        SELECT 
          aws_access_key_encrypted::text,
          aws_secret_key_encrypted::text,
          s3_bucket_name,
          s3_region,
          s3_bucket_path_prefix,
          max_file_size_mb,
          allowed_file_types
        FROM organization_settings 
        WHERE org_id = $1
      `, [this.orgId]);
      
      if (result.rows.length === 0) {
        throw new Error('AWS S3 configuration not found for organization');
      }
      
      const settings: OrganizationSettings = result.rows[0];
      
      // Decrypt credentials (using pass-through for development)
      const accessKey = String(settings.aws_access_key_encrypted || '');
      const secretKey = String(settings.aws_secret_key_encrypted || '');
      
      if (!accessKey || !secretKey) {
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
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey
        },
        region: config.region
      });
      
      // Cache client and config
      this.s3Client = s3Client;
      this.s3Config = config;
      
      console.log('✅ S3AttachmentManager: S3 client created successfully');
      
      return { client: s3Client, config };
      
    } catch (error) {
      console.error('❌ S3AttachmentManager: Failed to create S3 client:', error);
      throw new Error('Failed to create S3 client');
    } finally {
      client.release();
    }
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\./, '')
      .substring(0, 255);
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    // Check file size
    const maxSizeBytes = this.maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds limit of ${this.maxFileSize}MB`);
    }
    
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedTypes.includes(fileExtension)) {
      throw new Error(`File type ${fileExtension} not allowed. Allowed types: ${this.allowedTypes.join(', ')}`);
    }
  }

  /**
   * Upload file to S3
   */
  async uploadFile(file: File, filename?: string): Promise<UploadResult> {
    try {
      console.log('📁 S3AttachmentManager: Starting upload:', {
        filename: file.name,
        size: file.size,
        type: file.type,
        orgId: this.orgId,
        taskId: this.taskId,
        projectName: this.projectName
      });

      // Validate file
      this.validateFile(file);

      // Get S3 client
      const { client, config } = await this.getS3Client();
      
      // Generate unique key
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const sanitizedFilename = this.sanitizeFilename(filename || file.name);
      const key = `${config.pathPrefix}${this.sanitizeFilename(this.projectName)}/${timestamp}-${randomId}-${sanitizedFilename}`;
      
      console.log('🔑 S3AttachmentManager: Generated S3 key:', key);
      
      // Convert file to buffer
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type,
        Metadata: {
          'original-filename': file.name,
          'org-id': this.orgId,
          'task-id': this.taskId,
          'project-name': this.projectName,
          'uploaded-at': new Date().toISOString()
        }
      });
      
      await client.send(command);
      console.log('✅ S3AttachmentManager: File uploaded successfully');
      
      // Save to database
      const dbClient = await this.pool.connect();
      try {
        const insertResult = await dbClient.query(`
          INSERT INTO task_attachment (
            org_id, task_id, filename, original_filename, file_size, 
            file_type, s3_key, s3_bucket, uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, uploaded_at
        `, [
          this.orgId,
          this.taskId,
          key.split('/').pop() || file.name,
          file.name,
          file.size,
          file.type,
          key,
          config.bucket,
          '00000000-0000-0000-0000-000000000001' // TODO: Get from session
        ]);
        
        const attachmentId = insertResult.rows[0].id;
        const uploadedAt = insertResult.rows[0].uploaded_at;
        
        // Get user info
        const userResult = await dbClient.query(`
          SELECT name, primary_email FROM app_user WHERE id = $1
        `, ['00000000-0000-0000-0000-000000000001']); // TODO: Get from session
        
        const user = userResult.rows[0];
        
        return {
          id: attachmentId,
          filename: key.split('/').pop() || file.name,
          originalFilename: file.name,
          fileSize: file.size,
          fileType: file.type,
          s3Key: key,
          s3Bucket: config.bucket,
          uploadedAt,
          uploadedByName: user.name,
          uploadedByEmail: user.primary_email
        };
        
      } finally {
        dbClient.release();
      }
      
    } catch (error) {
      console.error('❌ S3AttachmentManager: Upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Get download URL for attachment
   */
  async getDownloadUrl(attachmentId: string): Promise<string> {
    try {
      console.log('🔗 S3AttachmentManager: Getting download URL for:', attachmentId);
      
      const { client, config } = await this.getS3Client();
      
      // Get attachment details from database
      const dbClient = await this.pool.connect();
      try {
        const result = await dbClient.query(`
          SELECT s3_key FROM task_attachment 
          WHERE id = $1 AND org_id = $2 AND task_id = $3 AND deleted_at IS NULL
        `, [attachmentId, this.orgId, this.taskId]);
        
        if (result.rows.length === 0) {
          throw new Error('Attachment not found');
        }
        
        const s3Key = result.rows[0].s3_key;
        
        // Generate signed URL
        const command = new GetObjectCommand({
          Bucket: config.bucket,
          Key: s3Key
        });
        
        const downloadUrl = await getSignedUrl(client, command, { expiresIn: 900 }); // 15 minutes
        console.log('✅ S3AttachmentManager: Download URL generated');
        
        return downloadUrl;
        
      } finally {
        dbClient.release();
      }
      
    } catch (error) {
      console.error('❌ S3AttachmentManager: Failed to get download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Delete attachment from S3 and database
   */
  async deleteFile(attachmentId: string): Promise<boolean> {
    try {
      console.log('🗑️ S3AttachmentManager: Deleting attachment:', attachmentId);
      
      const { client, config } = await this.getS3Client();
      
      // Get attachment details from database
      const dbClient = await this.pool.connect();
      try {
        const result = await dbClient.query(`
          SELECT s3_key FROM task_attachment 
          WHERE id = $1 AND org_id = $2 AND task_id = $3 AND deleted_at IS NULL
        `, [attachmentId, this.orgId, this.taskId]);
        
        if (result.rows.length === 0) {
          throw new Error('Attachment not found');
        }
        
        const s3Key = result.rows[0].s3_key;
        
        // Delete from S3
        const command = new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: s3Key
        });
        
        await client.send(command);
        console.log('✅ S3AttachmentManager: File deleted from S3');
        
        // Soft delete from database
        await dbClient.query(`
          UPDATE task_attachment 
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [attachmentId]);
        
        console.log('✅ S3AttachmentManager: Database record updated');
        
        return true;
        
      } finally {
        dbClient.release();
      }
      
    } catch (error) {
      console.error('❌ S3AttachmentManager: Delete failed:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * List all attachments for the task
   */
  async listAttachments(): Promise<Attachment[]> {
    try {
      console.log('📋 S3AttachmentManager: Listing attachments for task:', this.taskId);
      
      const dbClient = await this.pool.connect();
      try {
        const result = await dbClient.query(`
          SELECT 
            ta.id,
            ta.filename,
            ta.original_filename,
            ta.file_size,
            ta.file_type,
            ta.uploaded_at,
            u.name as uploaded_by_name,
            u.primary_email as uploaded_by_email
          FROM task_attachment ta
          JOIN app_user u ON u.id = ta.uploaded_by
          WHERE ta.org_id = $1 AND ta.task_id = $2 AND ta.deleted_at IS NULL
          ORDER BY ta.uploaded_at DESC
        `, [this.orgId, this.taskId]);
        
        const attachments: Attachment[] = result.rows.map(row => ({
          id: row.id,
          filename: row.filename,
          originalFilename: row.original_filename,
          fileSize: row.file_size,
          fileType: row.file_type,
          uploadedAt: row.uploaded_at,
          uploadedByName: row.uploaded_by_name,
          uploadedByEmail: row.uploaded_by_email
        }));
        
        console.log('✅ S3AttachmentManager: Found', attachments.length, 'attachments');
        
        return attachments;
        
      } finally {
        dbClient.release();
      }
      
    } catch (error) {
      console.error('❌ S3AttachmentManager: Failed to list attachments:', error);
      throw new Error('Failed to list attachments');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.s3Client) {
      this.s3Client.destroy();
      this.s3Client = null;
    }
    this.s3Config = null;
  }
}

/**
 * Utility function to create S3AttachmentManager instance
 */
export function createS3AttachmentManager(options: S3AttachmentManagerOptions): S3AttachmentManager {
  return new S3AttachmentManager(options);
}

/**
 * Default export
 */
export default S3AttachmentManager;
