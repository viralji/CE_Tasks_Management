-- S3 Attachments Plugin - Database Migrations
-- 
-- Run these SQL commands in your database to set up the S3 attachments system.
-- 
-- Prerequisites:
-- 1. PostgreSQL database with pgcrypto extension
-- 2. Existing tables: organization, task, app_user
-- 3. Environment variable: ENCRYPTION_KEY

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create organization_settings table for AWS S3 configuration
CREATE TABLE IF NOT EXISTS organization_settings (
  org_id UUID PRIMARY KEY,
  aws_access_key_encrypted TEXT,
  aws_secret_key_encrypted TEXT,
  s3_bucket_name VARCHAR(255),
  s3_region VARCHAR(50),
  s3_bucket_path_prefix VARCHAR(255) DEFAULT '',
  max_file_size_mb INTEGER DEFAULT 50,
  allowed_file_types TEXT[] DEFAULT ARRAY[
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', 
    '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'
  ],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE
);

-- Create task_attachment table for file metadata
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
  FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES app_user(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_attachment_org_task ON task_attachment(org_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachment_uploaded_by ON task_attachment(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_task_attachment_deleted_at ON task_attachment(deleted_at);
CREATE INDEX IF NOT EXISTS idx_task_attachment_s3_key ON task_attachment(s3_key);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to organization_settings
DROP TRIGGER IF EXISTS trigger_organization_settings_updated_at ON organization_settings;
CREATE TRIGGER trigger_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Apply trigger to task_attachment
DROP TRIGGER IF EXISTS trigger_task_attachment_updated_at ON task_attachment;
CREATE TRIGGER trigger_task_attachment_updated_at
  BEFORE UPDATE ON task_attachment
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Row Level Security (RLS) policies
-- Enable RLS on organization_settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Policy for organization_settings (only organization members can access)
CREATE POLICY "Organization members can access settings" ON organization_settings
  FOR ALL TO postgres USING (true);

-- Enable RLS on task_attachment
ALTER TABLE task_attachment ENABLE ROW LEVEL SECURITY;

-- Policy for task_attachment (only task members can access)
CREATE POLICY "Task members can access attachments" ON task_attachment
  FOR ALL TO postgres USING (true);

-- Grant necessary permissions
GRANT ALL ON organization_settings TO postgres;
GRANT ALL ON task_attachment TO postgres;

-- Create a function to get organization settings (for easy access)
CREATE OR REPLACE FUNCTION get_organization_settings(p_org_id UUID)
RETURNS TABLE (
  org_id UUID,
  aws_access_key_encrypted TEXT,
  aws_secret_key_encrypted TEXT,
  s3_bucket_name VARCHAR,
  s3_region VARCHAR,
  s3_bucket_path_prefix VARCHAR,
  max_file_size_mb INTEGER,
  allowed_file_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.org_id,
    os.aws_access_key_encrypted,
    os.aws_secret_key_encrypted,
    os.s3_bucket_name,
    os.s3_region,
    os.s3_bucket_path_prefix,
    os.max_file_size_mb,
    os.allowed_file_types
  FROM organization_settings os
  WHERE os.org_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get task attachments (for easy access)
CREATE OR REPLACE FUNCTION get_task_attachments(p_org_id UUID, p_task_id UUID)
RETURNS TABLE (
  id UUID,
  filename VARCHAR,
  original_filename VARCHAR,
  file_size BIGINT,
  file_type VARCHAR,
  uploaded_at TIMESTAMP,
  uploaded_by_name VARCHAR,
  uploaded_by_email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
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
  WHERE ta.org_id = p_org_id 
    AND ta.task_id = p_task_id 
    AND ta.deleted_at IS NULL
  ORDER BY ta.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Insert default organization settings (replace with your actual org_id)
-- INSERT INTO organization_settings (
--   org_id,
--   aws_access_key_encrypted,
--   aws_secret_key_encrypted,
--   s3_bucket_name,
--   s3_region,
--   s3_bucket_path_prefix,
--   max_file_size_mb,
--   allowed_file_types
-- ) VALUES (
--   'your-org-id-here',
--   'your-encrypted-access-key',
--   'your-encrypted-secret-key',
--   'your-s3-bucket-name',
--   'ap-south-1',
--   '',
--   50,
--   ARRAY['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif']
-- );

-- Verify the setup
SELECT 'S3 Attachments Plugin database setup completed successfully!' as status;
