-- =============================================================================
-- CE Tasks Intelligence - Complete PostgreSQL Multi-tenant Schema
-- - public schema
-- - UUID PKs via pgcrypto gen_random_uuid()
-- - timestamptz, soft deletes (deleted_at)
-- - composite FKs (org_id, id) for tenant safety
-- - RLS using GUC app.current_org
-- =============================================================================

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

-- 3) Helpers: updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END$$;

-- Date validation for parent/child projects
CREATE OR REPLACE FUNCTION validate_project_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if child project dates are within parent dates
  IF NEW.parent_id IS NOT NULL THEN
    DECLARE
      parent_start timestamptz;
      parent_end timestamptz;
    BEGIN
      SELECT start_at, end_at INTO parent_start, parent_end
      FROM project 
      WHERE org_id = NEW.org_id AND id = NEW.parent_id;
      
      IF parent_start IS NOT NULL AND NEW.start_at < parent_start THEN
        RAISE EXCEPTION 'Child project start date cannot be before parent start date';
      END IF;
      
      IF parent_end IS NOT NULL AND NEW.end_at > parent_end THEN
        RAISE EXCEPTION 'Child project end date cannot be after parent end date';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) GUC helper to parse current org
CREATE OR REPLACE FUNCTION current_org_uuid()
RETURNS uuid LANGUAGE SQL STABLE AS $$
  SELECT NULLIF(current_setting('app.current_org', true), '')::uuid
$$;

-- 5) Core tables: organization, app_user, membership
CREATE TABLE IF NOT EXISTS organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_slug_unique UNIQUE (slug)
);
CREATE TRIGGER trg_org_updated_at BEFORE UPDATE ON organization
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- use app_user, not user
CREATE TABLE IF NOT EXISTS app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_email text NOT NULL,
  name text,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS app_user_primary_email_unique ON app_user (primary_email);
CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON app_user
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS organization_membership (
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role membership_role NOT NULL DEFAULT 'MEMBER',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id),
  CONSTRAINT fk_membership_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- 6) Admin configs: IdP and S3 storage
CREATE TABLE IF NOT EXISTS identity_provider_config (
  org_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idp_type text NOT NULL CHECK (idp_type IN ('GOOGLE','AZURE')),
  client_id text NOT NULL,
  client_secret text NOT NULL,
  tenant_id text,
  allowed_domains text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_idp_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS identity_provider_unique_per_type ON identity_provider_config (org_id, idp_type);
CREATE TRIGGER trg_idp_updated_at BEFORE UPDATE ON identity_provider_config
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS storage_config (
  org_id uuid PRIMARY KEY,
  bucket text NOT NULL,
  region text NOT NULL,
  prefix text,
  kms_key_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_storage_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE
);
CREATE TRIGGER trg_storage_updated_at BEFORE UPDATE ON storage_config
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7) Projects (hierarchical) + access control
CREATE TABLE IF NOT EXISTS project (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid,
  name text NOT NULL,
  slug text NOT NULL,
  status project_status NOT NULL DEFAULT 'ACTIVE',
  start_at timestamptz,
  end_at timestamptz,
  severity text,
  description text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_project_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_parent FOREIGN KEY (org_id, parent_id) REFERENCES project(org_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_project_created_by FOREIGN KEY (created_by) REFERENCES app_user(id) ON DELETE SET NULL,
  CONSTRAINT fk_project_updated_by FOREIGN KEY (updated_by) REFERENCES app_user(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS project_slug_unique
  ON project (org_id, slug)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS project_parent_idx ON project (org_id, parent_id);
CREATE INDEX IF NOT EXISTS project_status_idx ON project (org_id, status);
CREATE TRIGGER trg_project_updated_at BEFORE UPDATE ON project
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_validate_project_dates 
  BEFORE INSERT OR UPDATE ON project
  FOR EACH ROW EXECUTE FUNCTION validate_project_dates();

CREATE TABLE IF NOT EXISTS project_access (
  org_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role project_role NOT NULL DEFAULT 'VIEWER',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, project_id, user_id),
  CONSTRAINT fk_pa_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- Project settings for configurable defaults
CREATE TABLE IF NOT EXISTS project_settings (
  org_id uuid NOT NULL,
  project_id uuid NOT NULL,
  default_task_due_days integer DEFAULT 2,
  default_task_priority task_priority DEFAULT 'MEDIUM',
  auto_assign_enabled boolean DEFAULT false,
  auto_assign_user_id uuid,
  notification_enabled boolean DEFAULT true,
  notification_on_task_create boolean DEFAULT true,
  notification_on_task_complete boolean DEFAULT true,
  notification_on_comment boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, project_id),
  CONSTRAINT fk_ps_project FOREIGN KEY (org_id, project_id) 
    REFERENCES project(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_auto_assign_user FOREIGN KEY (auto_assign_user_id) 
    REFERENCES app_user(id) ON DELETE SET NULL
);
CREATE TRIGGER trg_ps_updated_at BEFORE UPDATE ON project_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8) Tasks and related
CREATE TABLE IF NOT EXISTS task (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'OPEN',
  priority task_priority NOT NULL DEFAULT 'MEDIUM',
  due_at timestamptz,
  sla_hours integer,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_task_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_task_created_by FOREIGN KEY (created_by) REFERENCES app_user(id) ON DELETE SET NULL,
  CONSTRAINT fk_task_updated_by FOREIGN KEY (updated_by) REFERENCES app_user(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS task_project_idx ON task (org_id, project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS task_status_idx ON task (org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS task_due_idx ON task (org_id, due_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS task_fts_idx ON task USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))); 
CREATE TRIGGER trg_task_updated_at BEFORE UPDATE ON task
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS task_assignment (
  org_id uuid NOT NULL,
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, task_id, user_id),
  CONSTRAINT fk_ta_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_watcher (
  org_id uuid NOT NULL,
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, task_id, user_id),
  CONSTRAINT fk_tw_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tw_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- 9) Task Management Tables
-- project_member: users assigned to a project
CREATE TABLE IF NOT EXISTS project_member (
  org_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role project_role NOT NULL DEFAULT 'VIEWER',
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, project_id, user_id),
  CONSTRAINT fk_pm_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- task_status_log: track task status changes
CREATE TABLE IF NOT EXISTS task_status_log (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  from_status task_status,
  to_status task_status NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_tsl_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_tsl_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tsl_changed_by FOREIGN KEY (changed_by) REFERENCES app_user(id) ON DELETE SET NULL
);

-- task_closure_request: non-creators request closure
CREATE TABLE IF NOT EXISTS task_closure_request (
  org_id uuid NOT NULL,
  task_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, task_id, requested_by),
  CONSTRAINT fk_tcr_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_tcr_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tcr_requested_by FOREIGN KEY (requested_by) REFERENCES app_user(id) ON DELETE CASCADE
);

-- task_comment: task comments
CREATE TABLE IF NOT EXISTS task_comment (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_tc_org FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE,
  CONSTRAINT fk_tc_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tc_author FOREIGN KEY (author_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- 10) Attachments & comments
CREATE TABLE IF NOT EXISTS attachment (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  task_id uuid,
  s3_key text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  byte_size bigint,
  uploader_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_att_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_att_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_att_uploader FOREIGN KEY (uploader_id) REFERENCES app_user(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS att_project_idx ON attachment (org_id, project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS att_task_idx ON attachment (org_id, task_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS comment (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  author_id uuid,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_comment_task FOREIGN KEY (org_id, task_id) REFERENCES task(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_author FOREIGN KEY (author_id) REFERENCES app_user(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS comment_task_idx ON comment (org_id, task_id) WHERE deleted_at IS NULL;

-- 11) Chat
CREATE TABLE IF NOT EXISTS chat_room (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_room_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS chat_room_project_unique ON chat_room (org_id, project_id);

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
CREATE INDEX IF NOT EXISTS chat_message_room_idx ON chat_message (org_id, room_id, created_at);

-- chat_read_status: track unread messages per user
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

-- 12) Insights & Ops
CREATE TABLE IF NOT EXISTS ai_insight (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('ORG','PROJECT')),
  project_id uuid,
  title text NOT NULL,
  summary text,
  score numeric,
  json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_ai_project FOREIGN KEY (org_id, project_id) REFERENCES project(org_id, id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ai_insight_project_idx ON ai_insight (org_id, project_id, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES app_user(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS audit_log_org_time_idx ON audit_log (org_id, created_at);

CREATE TABLE IF NOT EXISTS webhook_event (
  org_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload jsonb NOT NULL,
  delivered_at timestamptz,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, id)
);
CREATE INDEX IF NOT EXISTS webhook_event_status_idx ON webhook_event (org_id, status, created_at);

-- 13) Indexes for performance
CREATE INDEX IF NOT EXISTS project_member_project_idx ON project_member (org_id, project_id);
CREATE INDEX IF NOT EXISTS project_member_user_idx ON project_member (org_id, user_id);
CREATE INDEX IF NOT EXISTS task_status_log_task_idx ON task_status_log (org_id, task_id, changed_at);
CREATE INDEX IF NOT EXISTS task_closure_request_task_idx ON task_closure_request (org_id, task_id);
CREATE INDEX IF NOT EXISTS chat_read_status_room_idx ON chat_read_status (org_id, room_id);
CREATE INDEX IF NOT EXISTS task_comment_task_idx ON task_comment (org_id, task_id, created_at);

-- 14) RLS: enable and policies
CREATE OR REPLACE FUNCTION rls_allow_tenant(org uuid)
RETURNS boolean LANGUAGE SQL IMMUTABLE AS $$ SELECT org = current_org_uuid() $$;

CREATE OR REPLACE FUNCTION not_deleted(ts timestamptz)
RETURNS boolean LANGUAGE SQL IMMUTABLE AS $$ SELECT ts IS NULL $$;

ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE task ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_watcher ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participant ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insight ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_closure_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Core table policies
DROP POLICY IF EXISTS org_select ON organization;
CREATE POLICY org_select ON organization FOR SELECT USING (rls_allow_tenant(id));
DROP POLICY IF EXISTS org_insert ON organization;
CREATE POLICY org_insert ON organization FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS org_update ON organization;
CREATE POLICY org_update ON organization FOR UPDATE USING (rls_allow_tenant(id));
DROP POLICY IF EXISTS org_delete ON organization;
CREATE POLICY org_delete ON organization FOR DELETE USING (rls_allow_tenant(id));

DROP POLICY IF EXISTS user_select ON app_user;
CREATE POLICY user_select ON app_user
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_membership m
      WHERE m.user_id = id AND m.org_id = current_org_uuid()
    )
  );
DROP POLICY IF EXISTS user_update ON app_user;
CREATE POLICY user_update ON app_user FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS user_insert ON app_user;
CREATE POLICY user_insert ON app_user FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS user_delete ON app_user;
CREATE POLICY user_delete ON app_user FOR DELETE USING (false);

DROP POLICY IF EXISTS mem_select ON organization_membership;
CREATE POLICY mem_select ON organization_membership FOR SELECT USING (rls_allow_tenant(org_id));
DROP POLICY IF EXISTS mem_cud ON organization_membership;
CREATE POLICY mem_cud ON organization_membership
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- idp config
DROP POLICY IF EXISTS idp_all ON identity_provider_config;
CREATE POLICY idp_all ON identity_provider_config
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- storage
DROP POLICY IF EXISTS storage_all ON storage_config;
CREATE POLICY storage_all ON storage_config
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- project (soft delete)
DROP POLICY IF EXISTS project_select ON project;
CREATE POLICY project_select ON project
  FOR SELECT USING (rls_allow_tenant(org_id) AND not_deleted(deleted_at));
DROP POLICY IF EXISTS project_cud ON project;
CREATE POLICY project_cud ON project
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- project_access
DROP POLICY IF EXISTS pa_all ON project_access;
CREATE POLICY pa_all ON project_access
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- task (soft delete)
DROP POLICY IF EXISTS task_select ON task;
CREATE POLICY task_select ON task
  FOR SELECT USING (rls_allow_tenant(org_id) AND not_deleted(deleted_at));
DROP POLICY IF EXISTS task_cud ON task;
CREATE POLICY task_cud ON task
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- task_assignment
DROP POLICY IF EXISTS ta_all ON task_assignment;
CREATE POLICY ta_all ON task_assignment
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- task_watcher
DROP POLICY IF EXISTS tw_all ON task_watcher;
CREATE POLICY tw_all ON task_watcher
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- attachment (soft delete)
DROP POLICY IF EXISTS att_select ON attachment;
CREATE POLICY att_select ON attachment
  FOR SELECT USING (rls_allow_tenant(org_id) AND not_deleted(deleted_at));
DROP POLICY IF EXISTS att_cud ON attachment;
CREATE POLICY att_cud ON attachment
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- comment (soft delete)
DROP POLICY IF EXISTS cmt_select ON comment;
CREATE POLICY cmt_select ON comment
  FOR SELECT USING (rls_allow_tenant(org_id) AND not_deleted(deleted_at));
DROP POLICY IF EXISTS cmt_cud ON comment;
CREATE POLICY cmt_cud ON comment
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- chat_room
DROP POLICY IF EXISTS room_all ON chat_room;
CREATE POLICY room_all ON chat_room
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- chat_participant
DROP POLICY IF EXISTS cp_all ON chat_participant;
CREATE POLICY cp_all ON chat_participant
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- chat_message
DROP POLICY IF EXISTS cm_all ON chat_message;
CREATE POLICY cm_all ON chat_message
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- ai_insight
DROP POLICY IF EXISTS ai_all ON ai_insight;
CREATE POLICY ai_all ON ai_insight
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- audit_log
DROP POLICY IF EXISTS audit_select ON audit_log;
CREATE POLICY audit_select ON audit_log
  FOR SELECT USING (rls_allow_tenant(org_id));
DROP POLICY IF EXISTS audit_insert ON audit_log;
CREATE POLICY audit_insert ON audit_log
  FOR INSERT WITH CHECK (rls_allow_tenant(org_id));

-- webhook_event
DROP POLICY IF EXISTS wh_all ON webhook_event;
CREATE POLICY wh_all ON webhook_event
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- project_member policies
DROP POLICY IF EXISTS pm_select ON project_member;
CREATE POLICY pm_select ON project_member FOR SELECT USING (rls_allow_tenant(org_id));
DROP POLICY IF EXISTS pm_cud ON project_member;
CREATE POLICY pm_cud ON project_member FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- task_status_log policies
DROP POLICY IF EXISTS tsl_select ON task_status_log;
CREATE POLICY tsl_select ON task_status_log FOR SELECT USING (rls_allow_tenant(org_id));
DROP POLICY IF EXISTS tsl_insert ON task_status_log;
CREATE POLICY tsl_insert ON task_status_log FOR INSERT WITH CHECK (rls_allow_tenant(org_id));

-- task_closure_request policies
DROP POLICY IF EXISTS tcr_select ON task_closure_request;
CREATE POLICY tcr_select ON task_closure_request FOR SELECT USING (rls_allow_tenant(org_id));
DROP POLICY IF EXISTS tcr_cud ON task_closure_request;
CREATE POLICY tcr_cud ON task_closure_request FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- chat_read_status policies
DROP POLICY IF EXISTS crs_select ON chat_read_status;
CREATE POLICY crs_select ON chat_read_status FOR SELECT USING (rls_allow_tenant(org_id));
DROP POLICY IF EXISTS crs_cud ON chat_read_status;
CREATE POLICY crs_cud ON chat_read_status FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- task_comment policies
DROP POLICY IF EXISTS tc_select ON task_comment;
CREATE POLICY tc_select ON task_comment FOR SELECT USING (rls_allow_tenant(org_id));
DROP POLICY IF EXISTS tc_insert ON task_comment;
CREATE POLICY tc_insert ON task_comment FOR INSERT WITH CHECK (rls_allow_tenant(org_id));
DROP POLICY IF EXISTS tc_update ON task_comment;
CREATE POLICY tc_update ON task_comment FOR UPDATE USING (rls_allow_tenant(org_id) AND author_id = current_setting('app.current_user')::uuid);
DROP POLICY IF EXISTS tc_delete ON task_comment;
CREATE POLICY tc_delete ON task_comment FOR DELETE USING (rls_allow_tenant(org_id) AND author_id = current_setting('app.current_user')::uuid);

-- project_settings policies
DROP POLICY IF EXISTS ps_all ON project_settings;
CREATE POLICY ps_all ON project_settings
  FOR ALL USING (rls_allow_tenant(org_id)) WITH CHECK (rls_allow_tenant(org_id));

-- 15) Seed data
WITH ins_org AS (
  INSERT INTO organization (slug, name) VALUES ('acme','Acme Corp')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
),
ins_user AS (
  INSERT INTO app_user (primary_email, name) VALUES ('owner@acme.com','Acme Owner')
  ON CONFLICT (primary_email) DO NOTHING
  RETURNING id
)
INSERT INTO organization_membership (org_id, user_id, role)
SELECT o.id, u.id, 'OWNER'::membership_role
FROM ins_org o, ins_user u
ON CONFLICT DO NOTHING;

-- Add dummy users for testing
WITH dummy_users AS (
  INSERT INTO app_user (id, name, primary_email, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Viral Shah', 'v.shah@cloudextel.com', now(), now()),
  (gen_random_uuid(), 'Alice Anderson', 'a.a@cloudextel.com', now(), now()),
  (gen_random_uuid(), 'Bob Brown', 'b.b@cloudextel.com', now(), now())
  ON CONFLICT (primary_email) DO NOTHING
  RETURNING id
)
INSERT INTO organization_membership (org_id, user_id, role)
SELECT o.id, u.id, 'ADMIN'::membership_role
FROM organization o, dummy_users u
ON CONFLICT DO NOTHING;

-- 16) Migration for existing projects
-- Add columns if they don't exist
ALTER TABLE project ADD COLUMN IF NOT EXISTS severity text;
ALTER TABLE project ADD COLUMN IF NOT EXISTS description text;

-- Set default values for existing projects
UPDATE project 
SET 
  status = 'ACTIVE'::project_status,
  severity = 'MEDIUM'
WHERE status IS NULL OR severity IS NULL;

-- Create default settings for existing projects
INSERT INTO project_settings (org_id, project_id)
SELECT org_id, id FROM project
ON CONFLICT (org_id, project_id) DO NOTHING;
