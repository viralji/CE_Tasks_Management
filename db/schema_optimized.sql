-- =============================================================================
-- NoClick - Optimized PostgreSQL Multi-tenant Schema
-- Production-ready with optimized indexes, constraints, and performance
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('OPEN','IN_PROGRESS','BLOCKED','DONE','CANCELED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
    CREATE TYPE membership_role AS ENUM ('OWNER','ADMIN','MEMBER','VIEWER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_role') THEN
    CREATE TYPE project_role AS ENUM ('ADMIN','EDITOR','VIEWER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('PLANNING','ACTIVE','AT_RISK','ON_HOLD','COMPLETED','CANCELED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_message_kind') THEN
    CREATE TYPE chat_message_kind AS ENUM ('USER','AI','SYSTEM');
  END IF;
END$$;

-- Helper Functions
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END$$;

-- RLS Helper Function
CREATE OR REPLACE FUNCTION rls_allow_tenant(org_id uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  RETURN org_id = current_setting('app.current_org', true)::uuid;
END$$;

-- Core Tables
CREATE TABLE IF NOT EXISTS organization (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_email text NOT NULL UNIQUE,
    name text NOT NULL,
    image text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_membership (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'MEMBER',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS project (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES project(org_id, id),
    name text NOT NULL,
    slug text NOT NULL,
    status project_status NOT NULL DEFAULT 'ACTIVE',
    start_at timestamptz,
    end_at timestamptz,
    description text,
    created_by uuid NOT NULL REFERENCES app_user(id),
    updated_by uuid NOT NULL REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, id),
    UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS project_member (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role project_role NOT NULL DEFAULT 'VIEWER',
    added_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, project_id, user_id),
    FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    status task_status NOT NULL DEFAULT 'OPEN',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    due_at timestamptz,
    created_by uuid NOT NULL REFERENCES app_user(id),
    updated_by uuid NOT NULL REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, id),
    FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_assignment (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    assigned_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, task_id, user_id),
    FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_comment (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, id),
    FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_attachment (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    filename text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text NOT NULL,
    s3_key text NOT NULL,
    uploaded_by uuid NOT NULL REFERENCES app_user(id),
    uploaded_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, id),
    FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_status_log (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    old_status task_status,
    new_status task_status NOT NULL,
    changed_by uuid NOT NULL REFERENCES app_user(id),
    changed_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, id),
    FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_watcher (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    added_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, task_id, user_id),
    FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_settings (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    project_id uuid NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, project_id, key),
    FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_access (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    project_id uuid NOT NULL,
    access_type text NOT NULL,
    access_value text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, project_id, access_type, access_value),
    FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS organization_settings (
    org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, key)
);

-- Optimized Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_organization_slug ON organization(slug);
CREATE INDEX IF NOT EXISTS idx_organization_status ON organization(status);

CREATE INDEX IF NOT EXISTS idx_app_user_email ON app_user(primary_email);
CREATE INDEX IF NOT EXISTS idx_app_user_name ON app_user(name);

CREATE INDEX IF NOT EXISTS idx_org_membership_user ON organization_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_org_membership_org ON organization_membership(org_id);
CREATE INDEX IF NOT EXISTS idx_org_membership_role ON organization_membership(role);

CREATE INDEX IF NOT EXISTS idx_project_org ON project(org_id);
CREATE INDEX IF NOT EXISTS idx_project_parent ON project(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_status ON project(status);
CREATE INDEX IF NOT EXISTS idx_project_slug ON project(org_id, slug);
CREATE INDEX IF NOT EXISTS idx_project_dates ON project(start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_project_member_user ON project_member(user_id);
CREATE INDEX IF NOT EXISTS idx_project_member_project ON project_member(org_id, project_id);

CREATE INDEX IF NOT EXISTS idx_task_project ON task(org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON task(status);
CREATE INDEX IF NOT EXISTS idx_task_priority ON task(priority);
CREATE INDEX IF NOT EXISTS idx_task_due_date ON task(due_at);
CREATE INDEX IF NOT EXISTS idx_task_created_by ON task(created_by);
CREATE INDEX IF NOT EXISTS idx_task_updated_by ON task(updated_by);

CREATE INDEX IF NOT EXISTS idx_task_assignment_user ON task_assignment(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignment_task ON task_assignment(org_id, task_id);

CREATE INDEX IF NOT EXISTS idx_task_comment_task ON task_comment(org_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_comment_user ON task_comment(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comment_created ON task_comment(created_at);

CREATE INDEX IF NOT EXISTS idx_task_attachment_task ON task_attachment(org_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachment_user ON task_attachment(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_task_status_log_task ON task_status_log(org_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_status_log_changed ON task_status_log(changed_at);

CREATE INDEX IF NOT EXISTS idx_task_watcher_user ON task_watcher(user_id);
CREATE INDEX IF NOT EXISTS idx_task_watcher_task ON task_watcher(org_id, task_id);

-- Triggers for updated_at
CREATE TRIGGER trigger_organization_updated_at
    BEFORE UPDATE ON organization
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_app_user_updated_at
    BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_project_updated_at
    BEFORE UPDATE ON project
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_task_updated_at
    BEFORE UPDATE ON task
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_project_settings_updated_at
    BEFORE UPDATE ON project_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_organization_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security (RLS)
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE task ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_watcher ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "org_select" ON organization FOR SELECT USING (true);
CREATE POLICY "org_cud" ON organization FOR ALL USING (rls_allow_tenant(id));

CREATE POLICY "user_select" ON app_user FOR SELECT USING (true);
CREATE POLICY "user_cud" ON app_user FOR ALL USING (true);

CREATE POLICY "membership_select" ON organization_membership FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "membership_cud" ON organization_membership FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "project_select" ON project FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "project_cud" ON project FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "pm_select" ON project_member FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "pm_cud" ON project_member FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "task_select" ON task FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "task_cud" ON task FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "task_assignment_select" ON task_assignment FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "task_assignment_cud" ON task_assignment FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "task_comment_select" ON task_comment FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "task_comment_cud" ON task_comment FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "task_attachment_select" ON task_attachment FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "task_attachment_cud" ON task_attachment FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "task_status_log_select" ON task_status_log FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "task_status_log_cud" ON task_status_log FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "task_watcher_select" ON task_watcher FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "task_watcher_cud" ON task_watcher FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "project_settings_select" ON project_settings FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "project_settings_cud" ON project_settings FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "project_access_select" ON project_access FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "project_access_cud" ON project_access FOR ALL USING (rls_allow_tenant(org_id));

CREATE POLICY "org_settings_select" ON organization_settings FOR SELECT USING (rls_allow_tenant(org_id));
CREATE POLICY "org_settings_cud" ON organization_settings FOR ALL USING (rls_allow_tenant(org_id));

-- Insert default organization and admin user
INSERT INTO organization (id, slug, name, status) VALUES 
('e939158f-d900-4167-9276-5cf9c66a58a5', 'cloudextel', 'CloudExtel', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_user (id, primary_email, name) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@cloudextel.com', 'Admin User')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organization_membership (org_id, user_id, role) VALUES 
('e939158f-d900-4167-9276-5cf9c66a58a5', '00000000-0000-0000-0000-000000000001', 'OWNER')
ON CONFLICT (org_id, user_id) DO NOTHING;
