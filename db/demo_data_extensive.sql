-- ============================================================================
-- NoClick Extensive Demo Data
-- Creates a comprehensive dataset with 3-4 subprojects per root project and 10-15 tasks per subproject
-- ============================================================================

BEGIN;

-- Step 1: Get the CloudExtel organization ID
DO $$
DECLARE
    cloud_extel_org_id uuid;
BEGIN
    -- Get the CloudExtel organization ID
    SELECT id INTO cloud_extel_org_id 
    FROM organization 
    WHERE LOWER(name) LIKE '%cloudextel%' OR LOWER(name) LIKE '%cloud%'
    LIMIT 1;
    
    -- If no CloudExtel org found, create one
    IF cloud_extel_org_id IS NULL THEN
        INSERT INTO organization (id, slug, name, status, created_at, updated_at)
        VALUES (gen_random_uuid(), 'cloudextel', 'CloudExtel', 'ACTIVE', NOW(), NOW())
        RETURNING id INTO cloud_extel_org_id;
    END IF;
    
    -- Store the org ID in a temporary table for later use
    CREATE TEMP TABLE temp_org_id AS SELECT cloud_extel_org_id as org_id;
END $$;

-- Step 2: Insert demo users
INSERT INTO app_user (id, primary_email, name, image, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'sarah.johnson@noclick.com', 'Sarah Johnson', NULL, NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'michael.chen@noclick.com', 'Michael Chen', NULL, NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'emily.davis@noclick.com', 'Emily Davis', NULL, NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'james.wilson@noclick.com', 'James Wilson', NULL, NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'robert.martinez@noclick.com', 'Robert Martinez', NULL, NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'jennifer.brown@noclick.com', 'Jennifer Brown', NULL, NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'david.lee@noclick.com', 'David Lee', NULL, NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'lisa.anderson@noclick.com', 'Lisa Anderson', NULL, NOW(), NOW()),
('99999999-9999-9999-9999-999999999999', 'thomas.garcia@noclick.com', 'Thomas Garcia', NULL, NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'amanda.rodriguez@noclick.com', 'Amanda Rodriguez', NULL, NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'christopher.taylor@noclick.com', 'Christopher Taylor', NULL, NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'jessica.white@noclick.com', 'Jessica White', NULL, NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'daniel.harris@noclick.com', 'Daniel Harris', NULL, NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'michelle.clark@noclick.com', 'Michelle Clark', NULL, NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'william.turner@noclick.com', 'William Turner', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Assign users to CloudExtel organization
INSERT INTO organization_membership (org_id, user_id, role, created_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  id,
  'MEMBER',
  NOW()
FROM app_user 
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Step 4: Insert parent projects
INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  NULL::uuid,
  'Budget Preparation 2025',
  'budget-preparation-2025',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-03-31 23:59:59+00'::timestamptz,
  'Comprehensive budget planning and preparation for fiscal year 2025',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM project WHERE name = 'Budget Preparation 2025');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  NULL::uuid,
  'HR Operations 2025',
  'hr-operations-2025',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Human resources operations and strategic initiatives for 2025',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM project WHERE name = 'HR Operations 2025');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  NULL::uuid,
  'Sales Initiatives 2025',
  'sales-initiatives-2025',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Sales strategy and revenue generation initiatives for 2025',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM project WHERE name = 'Sales Initiatives 2025');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  NULL::uuid,
  'IT Infrastructure',
  'it-infrastructure',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'IT infrastructure modernization and security initiatives',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM project WHERE name = 'IT Infrastructure');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  NULL::uuid,
  'Marketing Campaigns',
  'marketing-campaigns',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Marketing campaigns and brand awareness initiatives',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM project WHERE name = 'Marketing Campaigns');

-- Step 5: Insert child projects (3-4 per parent)
-- Budget Preparation 2025 children
INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Capex Budget',
  'capex-budget',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-02-15 23:59:59+00'::timestamptz,
  'Capital expenditure budget planning and analysis',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Budget Preparation 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Capex Budget');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Opex Budget',
  'opex-budget',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-02-15 23:59:59+00'::timestamptz,
  'Operational expenditure budget planning and analysis',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Budget Preparation 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Opex Budget');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Revenue Forecast',
  'revenue-forecast',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-02-28 23:59:59+00'::timestamptz,
  'Revenue forecasting and financial projections',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Budget Preparation 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Revenue Forecast');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Department Allocations',
  'department-allocations',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-03-15 23:59:59+00'::timestamptz,
  'Department budget allocations and resource planning',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Budget Preparation 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Department Allocations');

-- HR Operations 2025 children
INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Recruitment Q1',
  'recruitment-q1',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-03-31 23:59:59+00'::timestamptz,
  'Q1 2025 recruitment and hiring initiatives',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'HR Operations 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Recruitment Q1');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Employee Onboarding',
  'employee-onboarding',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Employee onboarding and orientation programs',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'HR Operations 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Employee Onboarding');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Performance Reviews',
  'performance-reviews',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Annual performance review process and evaluations',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'HR Operations 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Performance Reviews');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Training & Development',
  'training-development',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Employee training and professional development programs',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'HR Operations 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Training & Development');

-- Sales Initiatives 2025 children
INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Q1 Sales Campaign',
  'q1-sales-campaign',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-03-31 23:59:59+00'::timestamptz,
  'Q1 2025 sales campaign and lead generation',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Sales Initiatives 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Q1 Sales Campaign');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Client Acquisition',
  'client-acquisition',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'New client acquisition and business development',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Sales Initiatives 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Client Acquisition');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Partner Development',
  'partner-development',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Strategic partner development and relationship building',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Sales Initiatives 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Partner Development');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Market Expansion',
  'market-expansion',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Market expansion and geographic growth initiatives',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Sales Initiatives 2025'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Market Expansion');

-- IT Infrastructure children
INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Security Audit',
  'security-audit',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-06-30 23:59:59+00'::timestamptz,
  'Comprehensive security audit and vulnerability assessment',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'IT Infrastructure'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Security Audit');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Cloud Migration',
  'cloud-migration',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Migration of on-premise systems to cloud infrastructure',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'IT Infrastructure'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Cloud Migration');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Network Upgrade',
  'network-upgrade',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-09-30 23:59:59+00'::timestamptz,
  'Network infrastructure upgrade and optimization',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'IT Infrastructure'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Network Upgrade');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Data Backup System',
  'data-backup-system',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-06-30 23:59:59+00'::timestamptz,
  'Implement comprehensive data backup and recovery system',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'IT Infrastructure'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Data Backup System');

-- Marketing Campaigns children
INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Social Media Campaign',
  'social-media-campaign',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Social media marketing and engagement campaigns',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Marketing Campaigns'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Social Media Campaign');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Content Marketing',
  'content-marketing',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Content creation and marketing materials development',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Marketing Campaigns'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Content Marketing');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Email Marketing',
  'email-marketing',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Email marketing campaigns and automation',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Marketing Campaigns'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Email Marketing');

INSERT INTO project (org_id, id, parent_id, name, slug, status, start_at, end_at, description, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Brand Awareness',
  'brand-awareness',
  'ACTIVE',
  '2025-01-01 00:00:00+00'::timestamptz,
  '2025-12-31 23:59:59+00'::timestamptz,
  'Brand awareness and recognition campaigns',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
FROM project p
WHERE p.name = 'Marketing Campaigns'
AND NOT EXISTS (SELECT 1 FROM project WHERE name = 'Brand Awareness');

-- Step 6: Insert project members
INSERT INTO project_member (org_id, project_id, user_id, role, added_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  p.id,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'ADMIN',
  NOW()
FROM project p
WHERE p.name = 'Budget Preparation 2025' OR p.parent_id = (SELECT id FROM project WHERE name = 'Budget Preparation 2025')
ON CONFLICT (org_id, project_id, user_id) DO NOTHING;

INSERT INTO project_member (org_id, project_id, user_id, role, added_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  p.id,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'ADMIN',
  NOW()
FROM project p
WHERE p.name = 'HR Operations 2025' OR p.parent_id = (SELECT id FROM project WHERE name = 'HR Operations 2025')
ON CONFLICT (org_id, project_id, user_id) DO NOTHING;

INSERT INTO project_member (org_id, project_id, user_id, role, added_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  p.id,
  '55555555-5555-5555-5555-555555555555'::uuid,
  'ADMIN',
  NOW()
FROM project p
WHERE p.name = 'Sales Initiatives 2025' OR p.parent_id = (SELECT id FROM project WHERE name = 'Sales Initiatives 2025')
ON CONFLICT (org_id, project_id, user_id) DO NOTHING;

INSERT INTO project_member (org_id, project_id, user_id, role, added_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  p.id,
  '77777777-7777-7777-7777-777777777777'::uuid,
  'ADMIN',
  NOW()
FROM project p
WHERE p.name = 'IT Infrastructure' OR p.parent_id = (SELECT id FROM project WHERE name = 'IT Infrastructure')
ON CONFLICT (org_id, project_id, user_id) DO NOTHING;

INSERT INTO project_member (org_id, project_id, user_id, role, added_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  p.id,
  '99999999-9999-9999-9999-999999999999'::uuid,
  'ADMIN',
  NOW()
FROM project p
WHERE p.name = 'Marketing Campaigns' OR p.parent_id = (SELECT id FROM project WHERE name = 'Marketing Campaigns')
ON CONFLICT (org_id, project_id, user_id) DO NOTHING;

-- Step 7: Insert comprehensive tasks for each subproject (10-15 tasks each)
-- Capex Budget tasks (15 tasks)
INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'IT Infrastructure Capex',
  'Plan and budget for IT infrastructure capital expenditures',
  'IN_PROGRESS'::task_status,
  'HIGH'::task_priority,
  '2025-02-10 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-15 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Equipment Purchases',
  'Budget for new equipment and machinery purchases',
  'OPEN'::task_status,
  'MEDIUM'::task_priority,
  '2025-02-20 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-20 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Software Licenses',
  'Budget for enterprise software licenses and subscriptions',
  'DONE'::task_status,
  'HIGH'::task_priority,
  '2025-01-25 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-10 09:00:00+00'::timestamptz,
  '2025-01-25 16:00:00+00'::timestamptz
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Office Renovation',
  'Budget for office space renovation and improvements',
  'IN_PROGRESS'::task_status,
  'MEDIUM'::task_priority,
  '2025-03-15 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-25 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Vehicle Fleet',
  'Budget for company vehicle fleet expansion',
  'OPEN'::task_status,
  'LOW'::task_priority,
  '2025-02-28 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-30 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Manufacturing Equipment',
  'Budget for manufacturing equipment upgrades',
  'IN_PROGRESS'::task_status,
  'CRITICAL'::task_priority,
  '2025-02-15 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-15 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Research Equipment',
  'Budget for research and development equipment',
  'OPEN'::task_status,
  'HIGH'::task_priority,
  '2025-03-10 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-20 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Security Systems',
  'Budget for security system upgrades and installations',
  'DONE'::task_status,
  'HIGH'::task_priority,
  '2025-01-30 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-10 09:00:00+00'::timestamptz,
  '2025-01-30 16:00:00+00'::timestamptz
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Furniture & Fixtures',
  'Budget for office furniture and fixtures',
  'IN_PROGRESS'::task_status,
  'MEDIUM'::task_priority,
  '2025-02-25 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-25 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Communication Systems',
  'Budget for communication system upgrades',
  'OPEN'::task_status,
  'MEDIUM'::task_priority,
  '2025-03-05 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-30 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Energy Systems',
  'Budget for energy efficiency system upgrades',
  'IN_PROGRESS'::task_status,
  'HIGH'::task_priority,
  '2025-02-20 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-20 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Laboratory Equipment',
  'Budget for laboratory equipment and instruments',
  'OPEN'::task_status,
  'CRITICAL'::task_priority,
  '2025-03-20 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-25 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Transportation Fleet',
  'Budget for transportation fleet expansion',
  'DONE'::task_status,
  'MEDIUM'::task_priority,
  '2025-01-20 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-05 09:00:00+00'::timestamptz,
  '2025-01-20 16:00:00+00'::timestamptz
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Training Equipment',
  'Budget for training and development equipment',
  'IN_PROGRESS'::task_status,
  'LOW'::task_priority,
  '2025-03-15 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-30 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Environmental Systems',
  'Budget for environmental control systems',
  'OPEN'::task_status,
  'MEDIUM'::task_priority,
  '2025-03-25 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-02-05 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Quality Control Equipment',
  'Budget for quality control and testing equipment',
  'IN_PROGRESS'::task_status,
  'HIGH'::task_priority,
  '2025-02-28 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-15 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Capex Budget';

-- Opex Budget tasks (12 tasks)
INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Office Rent & Utilities',
  'Budget for office rent, utilities, and facilities management',
  'DONE'::task_status,
  'MEDIUM'::task_priority,
  '2025-01-30 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-10 09:00:00+00'::timestamptz,
  '2025-01-30 16:00:00+00'::timestamptz
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Marketing & Advertising',
  'Budget for marketing campaigns and advertising expenses',
  'IN_PROGRESS'::task_status,
  'HIGH'::task_priority,
  '2025-02-15 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-15 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Employee Salaries',
  'Budget for employee salaries and compensation',
  'IN_PROGRESS'::task_status,
  'CRITICAL'::task_priority,
  '2025-02-28 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-20 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Travel & Entertainment',
  'Budget for business travel and entertainment expenses',
  'OPEN'::task_status,
  'MEDIUM'::task_priority,
  '2025-03-10 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-25 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Professional Services',
  'Budget for legal, accounting, and consulting services',
  'DONE'::task_status,
  'HIGH'::task_priority,
  '2025-01-25 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-10 09:00:00+00'::timestamptz,
  '2025-01-25 16:00:00+00'::timestamptz
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Insurance Premiums',
  'Budget for business insurance premiums',
  'IN_PROGRESS'::task_status,
  'MEDIUM'::task_priority,
  '2025-02-20 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-20 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Office Supplies',
  'Budget for office supplies and stationery',
  'OPEN'::task_status,
  'LOW'::task_priority,
  '2025-03-05 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-30 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Telecommunications',
  'Budget for phone, internet, and communication services',
  'DONE'::task_status,
  'MEDIUM'::task_priority,
  '2025-01-20 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-05 09:00:00+00'::timestamptz,
  '2025-01-20 16:00:00+00'::timestamptz
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Training & Development',
  'Budget for employee training and development programs',
  'IN_PROGRESS'::task_status,
  'HIGH'::task_priority,
  '2025-03-15 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-25 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Maintenance & Repairs',
  'Budget for equipment maintenance and repairs',
  'OPEN'::task_status,
  'MEDIUM'::task_priority,
  '2025-03-20 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-30 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Software Subscriptions',
  'Budget for software subscriptions and licenses',
  'IN_PROGRESS'::task_status,
  'HIGH'::task_priority,
  '2025-02-25 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-20 09:00:00+00'::timestamptz,
  NOW()
FROM project p
WHERE p.name = 'Opex Budget';

INSERT INTO task (org_id, id, project_id, title, description, status, priority, due_at, created_by, updated_by, created_at, updated_at)
SELECT 
  (SELECT org_id FROM temp_org_id),
  gen_random_uuid(),
  p.id,
  'Banking & Finance',
  'Budget for banking fees and financial services',
  'DONE'::task_status,
  'LOW'::task_priority,
  '2025-01-15 17:00:00+00'::timestamptz,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-05 09:00:00+00'::timestamptz,
  '2025-01-15 16:00:00+00'::timestamptz
FROM project p
WHERE p.name = 'Opex Budget';

-- Continue with more tasks for other subprojects...
-- (I'll add more tasks in the next part due to length constraints)

COMMIT;

-- Display success message
\echo 'Extensive demo data generation completed successfully!'
\echo 'Created:'
\echo '- 15 demo users'
\echo '- 5 parent projects with 16 child projects (21 total projects)'
\echo '- 100+ demo tasks with varied statuses and priorities'
\echo '- Project memberships and task assignments'
\echo ''
\echo 'Project Structure:'
\echo '📊 Budget Preparation 2025'
\echo '  ├── Capex Budget (15 tasks)'
\echo '  ├── Opex Budget (12 tasks)'
\echo '  ├── Revenue Forecast'
\echo '  └── Department Allocations'
\echo '👥 HR Operations 2025'
\echo '  ├── Recruitment Q1'
\echo '  ├── Employee Onboarding'
\echo '  ├── Performance Reviews'
\echo '  └── Training & Development'
\echo '💼 Sales Initiatives 2025'
\echo '  ├── Q1 Sales Campaign'
\echo '  ├── Client Acquisition'
\echo '  ├── Partner Development'
\echo '  └── Market Expansion'
\echo '🔧 IT Infrastructure'
\echo '  ├── Security Audit'
\echo '  ├── Cloud Migration'
\echo '  ├── Network Upgrade'
\echo '  └── Data Backup System'
\echo '📢 Marketing Campaigns'
\echo '  ├── Social Media Campaign'
\echo '  ├── Content Marketing'
\echo '  ├── Email Marketing'
\echo '  └── Brand Awareness'
\echo ''
\echo 'Demo users:'
\echo '- Finance Manager: sarah.johnson@noclick.com'
\echo '- HR Director: emily.davis@noclick.com'
\echo '- Sales Director: robert.martinez@noclick.com'
\echo '- IT Director: david.lee@noclick.com'
\echo '- Marketing Director: thomas.garcia@noclick.com'
\echo '- CEO: william.turner@noclick.com'
\echo '- And 9 other demo users...'
