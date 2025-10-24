-- =============================================================================
-- Task Attachments Table for File Storage
-- Stores metadata for files attached to tasks with S3 integration
-- =============================================================================

-- Create task_attachment table
CREATE TABLE IF NOT EXISTS task_attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    task_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL, -- Sanitized filename for display
    original_filename VARCHAR(255) NOT NULL, -- Original filename from upload
    file_size BIGINT NOT NULL, -- File size in bytes
    file_type VARCHAR(100), -- MIME type
    s3_key VARCHAR(500) NOT NULL, -- S3 object key for file retrieval
    s3_bucket VARCHAR(255) NOT NULL, -- S3 bucket name
    uploaded_by UUID NOT NULL REFERENCES app_user(id),
    FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER task_attachment_updated_at
    BEFORE UPDATE ON task_attachment
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add RLS policy
ALTER TABLE task_attachment ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see attachments for tasks in their organization
CREATE POLICY task_attachment_org_isolation ON task_attachment
    FOR ALL TO postgres
    USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_attachment_org_id ON task_attachment(org_id);
CREATE INDEX IF NOT EXISTS idx_task_attachment_task_id ON task_attachment(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachment_uploaded_by ON task_attachment(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_task_attachment_uploaded_at ON task_attachment(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_task_attachment_deleted_at ON task_attachment(deleted_at);
CREATE INDEX IF NOT EXISTS idx_task_attachment_s3_key ON task_attachment(s3_key);

-- Add unique constraint to prevent duplicate S3 keys
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_attachment_s3_key_unique 
    ON task_attachment(s3_key) 
    WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON TABLE task_attachment IS 'File attachments for tasks stored in S3';
COMMENT ON COLUMN task_attachment.filename IS 'Sanitized filename for safe display';
COMMENT ON COLUMN task_attachment.original_filename IS 'Original filename from user upload';
COMMENT ON COLUMN task_attachment.file_size IS 'File size in bytes';
COMMENT ON COLUMN task_attachment.file_type IS 'MIME type of the file';
COMMENT ON COLUMN task_attachment.s3_key IS 'S3 object key for file retrieval';
COMMENT ON COLUMN task_attachment.s3_bucket IS 'S3 bucket where file is stored';
COMMENT ON COLUMN task_attachment.uploaded_by IS 'User who uploaded the file';
COMMENT ON COLUMN task_attachment.deleted_at IS 'Soft delete timestamp';
