-- =============================================================================
-- NoClick - Complete Database Schema
-- Single file with all tables, indexes, triggers, and RLS policies
-- =============================================================================

-- Create database and user if they don't exist
SELECT 'CREATE DATABASE noclick_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'noclick_db')\gexec
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'noclick_user') THEN
        CREATE ROLE noclick_user WITH LOGIN PASSWORD 'postgres';
    END IF;
END
$$;
GRANT ALL PRIVILEGES ON DATABASE noclick_db TO noclick_user;

-- Connect to the database
\c noclick_db

-- Set search path to public schema
SET search_path TO public;

-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Enums
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

-- 3) Helper Functions
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION rls_allow_tenant(tenant_id uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  -- For now, allow all access - we'll handle permissions in the application layer
  RETURN TRUE;
END$$;

-- 4) Core Tables
CREATE TABLE IF NOT EXISTS organization (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_user (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  primary_email text NOT NULL UNIQUE,
  image text,
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS user_organization (
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role membership_role NOT NULL DEFAULT 'MEMBER',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id),
  CONSTRAINT fk_uo_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_uo_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  max_file_size_mb integer NOT NULL DEFAULT 50,
  allowed_file_types text[] DEFAULT ARRAY['.pdf','.doc','.docx','.txt','.jpg','.jpeg','.png','.gif','.zip','.rar'],
  aws_access_key_encrypted text,
  aws_secret_key_encrypted text,
  s3_bucket_name text,
  s3_region text DEFAULT 'us-east-1',
  s3_bucket_path_prefix text DEFAULT 'uploads/',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(org_id),
  CONSTRAINT fk_os_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_os_user FOREIGN KEY (updated_by) REFERENCES app_user(id) ON DELETE SET NULL
);

-- 5) Projects
CREATE TABLE IF NOT EXISTS project (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid,
  start_at date,
  end_at date,
  severity text NOT NULL DEFAULT 'MEDIUM',
  status project_status NOT NULL DEFAULT 'ACTIVE',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_project_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_parent FOREIGN KEY (org_id, parent_id) REFERENCES project(org_id, id) ON DELETE CASCADE,
  UNIQUE(org_id, slug)
);

CREATE TABLE IF NOT EXISTS project_member (
  org_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role project_role NOT NULL DEFAULT 'VIEWER',
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, project_id, user_id),
  CONSTRAINT fk_pm_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_settings (
  org_id uuid NOT NULL,
  project_id uuid NOT NULL,
  default_task_due_days integer NOT NULL DEFAULT 7,
  default_task_priority task_priority NOT NULL DEFAULT 'MEDIUM',
  auto_assign_enabled boolean NOT NULL DEFAULT false,
  auto_assign_user_id uuid,
  notification_enabled boolean NOT NULL DEFAULT true,
  notification_on_task_create boolean NOT NULL DEFAULT true,
  notification_on_task_complete boolean NOT NULL DEFAULT true,
  notification_on_comment boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, project_id),
  CONSTRAINT fk_ps_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_user FOREIGN KEY (auto_assign_user_id) REFERENCES app_user(id) ON DELETE SET NULL
);

-- 6) Tasks
CREATE TABLE IF NOT EXISTS task (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'OPEN',
  priority task_priority NOT NULL DEFAULT 'MEDIUM',
  due_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_task_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_task_creator FOREIGN KEY (created_by) REFERENCES app_user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_assignment (
  org_id uuid NOT NULL,
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, task_id, user_id),
  CONSTRAINT fk_ta_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_status_log (
  org_id uuid NOT NULL,
  task_id uuid NOT NULL,
  from_status task_status,
  to_status task_status NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_tsl_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_tsl_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tsl_user FOREIGN KEY (changed_by) REFERENCES app_user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_comment (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  author_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_tc_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_tc_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tc_author FOREIGN KEY (author_id) REFERENCES app_user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_attachment (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text NOT NULL,
  s3_key text NOT NULL,
  s3_bucket text NOT NULL,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_ta_attach_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_attach_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_attach_user FOREIGN KEY (uploaded_by) REFERENCES app_user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_watcher (
  org_id uuid NOT NULL,
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, task_id, user_id),
  CONSTRAINT fk_tw_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_tw_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tw_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_closure_request (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'PENDING',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_tcr_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_tcr_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tcr_requester FOREIGN KEY (requested_by) REFERENCES app_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_tcr_reviewer FOREIGN KEY (reviewed_by) REFERENCES app_user(id) ON DELETE SET NULL
);

-- 7) Chat
CREATE TABLE IF NOT EXISTS chat_room (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_room_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_participant (
  org_id uuid NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, room_id, user_id),
  CONSTRAINT fk_cp_room FOREIGN KEY (org_id, room_id) REFERENCES chat_room(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_message (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  author_id uuid,
  kind chat_message_kind NOT NULL DEFAULT 'USER',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_task_id uuid,
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_cm_room FOREIGN KEY (org_id, room_id) REFERENCES chat_room(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_author FOREIGN KEY (author_id) REFERENCES app_user(id) ON DELETE SET NULL,
  CONSTRAINT fk_cm_created_task FOREIGN KEY (org_id, created_task_id) REFERENCES task(org_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_read_status (
  org_id uuid NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, room_id, user_id),
  CONSTRAINT fk_crs_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_crs_room FOREIGN KEY (org_id, room_id) REFERENCES chat_room(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_crs_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_mention (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  mentioned_user_id uuid NOT NULL,
  message_id uuid NOT NULL,
  mentioned_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  PRIMARY KEY (org_id, id),
  UNIQUE(org_id, room_id, mentioned_user_id, message_id),
  CONSTRAINT fk_cm_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_room FOREIGN KEY (org_id, room_id) REFERENCES chat_room(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_mentioned_user FOREIGN KEY (mentioned_user_id) REFERENCES app_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_message FOREIGN KEY (org_id, message_id) REFERENCES chat_message(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_mentioned_by FOREIGN KEY (mentioned_by) REFERENCES app_user(id) ON DELETE CASCADE
);

-- 8) Indexes
CREATE INDEX IF NOT EXISTS project_parent_idx ON project (org_id, parent_id);
CREATE INDEX IF NOT EXISTS project_status_idx ON project (org_id, status);
CREATE INDEX IF NOT EXISTS project_member_project_idx ON project_member (org_id, project_id);
CREATE INDEX IF NOT EXISTS project_member_user_idx ON project_member (org_id, user_id);
CREATE INDEX IF NOT EXISTS task_project_idx ON task (org_id, project_id, status);
CREATE INDEX IF NOT EXISTS task_created_by_idx ON task (org_id, created_by);
CREATE INDEX IF NOT EXISTS task_status_log_task_idx ON task_status_log (org_id, task_id, changed_at);
CREATE INDEX IF NOT EXISTS task_comment_task_idx ON task_comment (org_id, task_id, created_at);
CREATE INDEX IF NOT EXISTS task_attachment_task_idx ON task_attachment (org_id, task_id);
CREATE INDEX IF NOT EXISTS task_closure_request_task_idx ON task_closure_request (org_id, task_id);
CREATE INDEX IF NOT EXISTS chat_message_room_idx ON chat_message (org_id, room_id, created_at);
CREATE INDEX IF NOT EXISTS chat_read_status_room_idx ON chat_read_status (org_id, room_id);
CREATE INDEX IF NOT EXISTS chat_mention_user_idx ON chat_mention (org_id, mentioned_user_id, read_at);
CREATE INDEX IF NOT EXISTS chat_mention_room_idx ON chat_mention (org_id, room_id);

-- 9) Triggers
CREATE TRIGGER project_updated_at
  BEFORE UPDATE ON project
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER task_updated_at
  BEFORE UPDATE ON task
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER task_comment_updated_at
  BEFORE UPDATE ON task_comment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER project_settings_updated_at
  BEFORE UPDATE ON project_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 10) Enable RLS
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_watcher ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_closure_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participant ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mention ENABLE ROW LEVEL SECURITY;

-- 11) RLS Policies
CREATE POLICY org_all ON organization FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY user_all ON app_user FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY uo_all ON user_organization FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY project_all ON project FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY pm_all ON project_member FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY ps_all ON project_settings FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY task_all ON task FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY ta_all ON task_assignment FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY tsl_all ON task_status_log FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY tc_all ON task_comment FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY ta_attach_all ON task_attachment FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY tw_all ON task_watcher FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY tcr_all ON task_closure_request FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY cr_all ON chat_room FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY cp_all ON chat_participant FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY cm_all ON chat_message FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY crs_all ON chat_read_status FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));
CREATE POLICY cm_mention_all ON chat_mention FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- 12) Seed Data
INSERT INTO organization (slug, name) VALUES ('cloudextel','CloudExtel') ON CONFLICT (slug) DO NOTHING;
INSERT INTO app_user (name, primary_email) VALUES ('Admin User', 'admin@admin.com') ON CONFLICT (primary_email) DO NOTHING;
UPDATE app_user SET is_super_admin = TRUE WHERE primary_email = 'admin@admin.com';

-- Setup organization settings for upload functionality
INSERT INTO organization_settings (org_id, max_file_size_mb, allowed_file_types, aws_access_key_encrypted, aws_secret_key_encrypted, s3_bucket_name, s3_region, s3_bucket_path_prefix) 
SELECT id, 50, NULL, 'demo-access-key', 'demo-secret-key', 'demo-bucket', 'us-east-1', 'uploads/' 
FROM organization 
ON CONFLICT (org_id) DO NOTHING;

-- Grant all permissions to noclick_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO noclick_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO noclick_user;
