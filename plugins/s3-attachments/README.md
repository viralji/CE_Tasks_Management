# S3 Attachments Plugin

A complete, modular S3 file attachment system for Next.js applications with multi-tenant support.

## Features

- ✅ **Multi-tenant S3 configuration** per organization
- ✅ **Encrypted credential storage** in database
- ✅ **Project-based folder organization** (e.g., `ProjectName/filename.ext`)
- ✅ **Complete CRUD operations** (Upload, Download, Delete, List)
- ✅ **Signed URL generation** for secure downloads
- ✅ **File validation** (size, type, sanitization)
- ✅ **Comprehensive error handling** with detailed logging
- ✅ **TypeScript support** with full type definitions
- ✅ **Plug-and-play** - copy 2 files and you're ready!

## Quick Start

### 1. Copy Plugin Files

```bash
# Copy the entire plugin directory
cp -r plugins/s3-attachments/ your-project/plugins/s3-attachments/
```

### 2. Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 3. Database Setup

Run the SQL migrations in your database:

```sql
-- Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  org_id UUID PRIMARY KEY,
  aws_access_key_encrypted TEXT,
  aws_secret_key_encrypted TEXT,
  s3_bucket_name VARCHAR(255),
  s3_region VARCHAR(50),
  s3_bucket_path_prefix VARCHAR(255) DEFAULT '',
  max_file_size_mb INTEGER DEFAULT 50,
  allowed_file_types TEXT[] DEFAULT ARRAY['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif'],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create task_attachment table
CREATE TABLE IF NOT EXISTS task_attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  task_id UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  s3_key VARCHAR(500) NOT NULL,
  s3_bucket VARCHAR(255) NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id),
  FOREIGN KEY (uploaded_by) REFERENCES app_user(id)
);
```

### 4. Environment Variables

Add to your `.env`:

```env
ENCRYPTION_KEY=your-64-character-hex-encryption-key-here
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. API Routes

Copy the API routes to your project:

```bash
# Copy API routes
cp plugins/s3-attachments/api/* your-project/app/api/
```

### 6. Frontend Components

Copy the React components:

```bash
# Copy components
cp plugins/s3-attachments/components/* your-project/components/
```

### 7. Usage Example

```typescript
import { S3AttachmentManager } from '@/plugins/s3-attachments';

// Initialize the manager
const attachmentManager = new S3AttachmentManager({
  orgId: 'your-org-id',
  taskId: 'your-task-id',
  projectName: 'Your Project Name'
});

// Upload a file
const result = await attachmentManager.uploadFile(file, 'filename.pdf');

// Download a file
const downloadUrl = await attachmentManager.getDownloadUrl(attachmentId);

// Delete a file
await attachmentManager.deleteFile(attachmentId);

// List attachments
const attachments = await attachmentManager.listAttachments();
```

## API Reference

### S3AttachmentManager

Main class for managing S3 attachments.

#### Constructor Options

```typescript
interface S3AttachmentManagerOptions {
  orgId: string;           // Organization ID
  taskId: string;          // Task ID
  projectName: string;     // Project name (used for folder structure)
  maxFileSize?: number;    // Max file size in MB (default: 50)
  allowedTypes?: string[]; // Allowed file types (default: common types)
}
```

#### Methods

- `uploadFile(file: File, filename: string): Promise<UploadResult>`
- `getDownloadUrl(attachmentId: string): Promise<string>`
- `deleteFile(attachmentId: string): Promise<boolean>`
- `listAttachments(): Promise<Attachment[]>`

### API Endpoints

- `GET /api/tasks/[taskId]/attachments` - List attachments
- `POST /api/tasks/[taskId]/attachments` - Upload file
- `GET /api/tasks/[taskId]/attachments/[attachmentId]` - Get download URL
- `DELETE /api/tasks/[taskId]/attachments/[attachmentId]` - Delete attachment

## Configuration

### Organization Settings

Configure AWS credentials per organization:

```typescript
// Admin API: POST /api/admin/organizations/[orgId]/settings
{
  "aws_access_key": "AKIA...",
  "aws_secret_key": "secret...",
  "s3_bucket_name": "my-bucket",
  "s3_region": "ap-south-1",
  "s3_bucket_path_prefix": "",
  "max_file_size_mb": 100,
  "allowed_file_types": [".pdf", ".doc", ".docx"]
}
```

### File Organization

Files are stored in S3 with the following structure:
```
{projectName}/{timestamp}-{randomId}-{filename}
```

Example:
```
December Project/1761062863613-qrm20hm450s-Region.xlsx
Budget Project/1761062863614-abc123def456-Budget.xlsx
```

## Error Handling

The plugin includes comprehensive error handling:

- **Validation errors** for file size, type, and access
- **S3 errors** with detailed logging
- **Database errors** with rollback support
- **Network errors** with retry logic
- **User-friendly error messages** in the frontend

## Security Features

- **Encrypted credentials** stored in database
- **Signed URLs** with expiration (15 minutes)
- **Access control** - users can only access their organization's files
- **File sanitization** to prevent path traversal
- **Size limits** to prevent abuse
- **Type validation** for security

## Performance Optimizations

- **Connection pooling** for database operations
- **Lazy loading** of S3 clients
- **Caching** of organization settings
- **Batch operations** for multiple files
- **Compression** for large files

## Troubleshooting

### Common Issues

1. **"AWS credentials not found"**
   - Ensure organization settings are configured
   - Check if AWS credentials are valid

2. **"File upload failed"**
   - Check file size limits
   - Verify S3 bucket permissions
   - Ensure bucket exists in the specified region

3. **"Download URL expired"**
   - Signed URLs expire after 15 minutes
   - Generate a new download URL

### Debug Mode

Enable detailed logging:

```typescript
// Set environment variable
DEBUG_S3_ATTACHMENTS=true
```

This will log all S3 operations, database queries, and error details.

## License

MIT License - feel free to use in any project!

## Support

For issues or questions, check the error logs first - they contain detailed information about what went wrong.
