-- =============================================================================
-- Organization Settings Table for AWS S3 Configuration
-- Stores encrypted AWS credentials per organization for multi-tenancy
-- =============================================================================

-- Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    aws_access_key_encrypted TEXT,
    aws_secret_key_encrypted TEXT,
    s3_bucket_name VARCHAR(255),
    s3_region VARCHAR(50) DEFAULT 'us-east-1',
    s3_bucket_path_prefix VARCHAR(255) DEFAULT '',
    max_file_size_mb INTEGER DEFAULT 50,
    allowed_file_types TEXT[], -- NULL means all types allowed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES app_user(id),
    updated_by UUID REFERENCES app_user(id),
    UNIQUE(org_id)
);

-- Add updated_at trigger
CREATE TRIGGER organization_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add RLS policy
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see settings for their organization
CREATE POLICY organization_settings_org_isolation ON organization_settings
    FOR ALL TO postgres
    USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON organization_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_settings_created_at ON organization_settings(created_at);

-- Add comments
COMMENT ON TABLE organization_settings IS 'AWS S3 configuration settings per organization';
COMMENT ON COLUMN organization_settings.aws_access_key_encrypted IS 'Encrypted AWS access key using pgcrypto';
COMMENT ON COLUMN organization_settings.aws_secret_key_encrypted IS 'Encrypted AWS secret key using pgcrypto';
COMMENT ON COLUMN organization_settings.s3_bucket_name IS 'S3 bucket name for file storage';
COMMENT ON COLUMN organization_settings.s3_region IS 'AWS region for S3 bucket';
COMMENT ON COLUMN organization_settings.s3_bucket_path_prefix IS 'Optional prefix for organization file isolation';
COMMENT ON COLUMN organization_settings.max_file_size_mb IS 'Maximum file size in MB (default 50MB)';
COMMENT ON COLUMN organization_settings.allowed_file_types IS 'Array of allowed file extensions (NULL = all types)';
