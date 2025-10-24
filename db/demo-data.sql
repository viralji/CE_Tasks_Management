-- =============================================================================
-- NoClick - Demo Data
-- Comprehensive demo data for testing and demonstration
-- =============================================================================

-- 1) Organizations
INSERT INTO organization (slug, name) VALUES 
('cloudextel', 'CloudExtel'),
('acme', 'Acme Corporation'),
('techcorp', 'TechCorp Solutions')
ON CONFLICT (slug) DO NOTHING;

-- 2) Users
INSERT INTO app_user (name, primary_email) VALUES 
('Admin User', 'admin@admin.com'),
('Viral Shah', 'viralji@gmail.com'),
('John Doe', 'john@cloudextel.com'),
('Jane Smith', 'jane@cloudextel.com'),
('Mike Johnson', 'mike@cloudextel.com'),
('Sarah Wilson', 'sarah@cloudextel.com'),
('David Brown', 'david@cloudextel.com'),
('Lisa Davis', 'lisa@cloudextel.com'),
('Tom Wilson', 'tom@cloudextel.com'),
('Amy Chen', 'amy@cloudextel.com'),
('Bob Miller', 'bob@cloudextel.com'),
('Emma Taylor', 'emma@cloudextel.com'),
('Chris Lee', 'chris@cloudextel.com'),
('Anna Garcia', 'anna@cloudextel.com'),
('Mark Thompson', 'mark@cloudextel.com')
ON CONFLICT (primary_email) DO NOTHING;

-- 3) User-Organization Relationships
INSERT INTO user_organization (org_id, user_id, role) 
SELECT o.id, u.id, 'OWNER'::membership_role
FROM organization o, app_user u 
WHERE o.slug = 'cloudextel' AND u.primary_email = 'admin@admin.com'
ON CONFLICT (org_id, user_id) DO NOTHING;

INSERT INTO user_organization (org_id, user_id, role) 
SELECT o.id, u.id, 'ADMIN'::membership_role
FROM organization o, app_user u 
WHERE o.slug = 'cloudextel' AND u.primary_email IN ('viralji@gmail.com', 'john@cloudextel.com')
ON CONFLICT (org_id, user_id) DO NOTHING;

INSERT INTO user_organization (org_id, user_id, role) 
SELECT o.id, u.id, 'MEMBER'::membership_role
FROM organization o, app_user u 
WHERE o.slug = 'cloudextel' AND u.primary_email LIKE '%@cloudextel.com'
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 4) Projects
WITH org AS (SELECT id FROM organization WHERE slug = 'cloudextel')
INSERT INTO project (org_id, name, slug, description, status, severity) VALUES 
((SELECT id FROM org), 'Budget Preparation 2025', 'budget-2025', 'Annual budget planning and preparation for 2025', 'ACTIVE', 'HIGH'),
((SELECT id FROM org), 'HR Initiatives', 'hr-initiatives', 'Human resources projects and initiatives', 'ACTIVE', 'MEDIUM'),
((SELECT id FROM org), 'Sales Team Projects', 'sales-projects', 'Sales team related projects and activities', 'ACTIVE', 'HIGH'),
((SELECT id FROM org), 'Finance Operations', 'finance-ops', 'Finance team operations and projects', 'ACTIVE', 'MEDIUM'),
((SELECT id FROM org), 'IT Infrastructure', 'it-infrastructure', 'IT infrastructure and system improvements', 'ACTIVE', 'HIGH')
ON CONFLICT (org_id, slug) DO NOTHING;

-- 5) Child Projects
WITH org AS (SELECT id FROM organization WHERE slug = 'cloudextel'),
parent_budget AS (SELECT id FROM project WHERE slug = 'budget-2025'),
parent_hr AS (SELECT id FROM project WHERE slug = 'hr-initiatives'),
parent_sales AS (SELECT id FROM project WHERE slug = 'sales-projects'),
parent_finance AS (SELECT id FROM project WHERE slug = 'finance-ops'),
parent_it AS (SELECT id FROM project WHERE slug = 'it-infrastructure')
INSERT INTO project (org_id, parent_id, name, slug, description, status, severity) VALUES 
((SELECT id FROM org), (SELECT id FROM parent_budget), 'Capex Planning', 'capex-planning', 'Capital expenditure planning and budgeting', 'ACTIVE', 'HIGH'),
((SELECT id FROM org), (SELECT id FROM parent_budget), 'Opex Management', 'opex-management', 'Operational expenditure management', 'ACTIVE', 'MEDIUM'),
((SELECT id FROM org), (SELECT id FROM parent_budget), 'Revenue Forecasting', 'revenue-forecasting', 'Revenue forecasting and analysis', 'ACTIVE', 'HIGH'),
((SELECT id FROM org), (SELECT id FROM parent_hr), 'Recruitment Drive', 'recruitment-drive', 'Q1 recruitment and hiring', 'ACTIVE', 'MEDIUM'),
((SELECT id FROM org), (SELECT id FROM parent_hr), 'Employee Training', 'employee-training', 'Employee development and training programs', 'ACTIVE', 'LOW'),
((SELECT id FROM org), (SELECT id FROM parent_hr), 'Performance Reviews', 'performance-reviews', 'Annual performance review process', 'ACTIVE', 'MEDIUM'),
((SELECT id FROM org), (SELECT id FROM parent_sales), 'Lead Generation', 'lead-generation', 'Sales lead generation and nurturing', 'ACTIVE', 'HIGH'),
((SELECT id FROM org), (SELECT id FROM parent_sales), 'Client Onboarding', 'client-onboarding', 'New client onboarding process', 'ACTIVE', 'MEDIUM'),
((SELECT id FROM org), (SELECT id FROM parent_sales), 'Sales Training', 'sales-training', 'Sales team training and development', 'ACTIVE', 'MEDIUM'),
((SELECT id FROM org), (SELECT id FROM parent_finance), 'Financial Reporting', 'financial-reporting', 'Monthly and quarterly financial reports', 'ACTIVE', 'HIGH'),
((SELECT id FROM org), (SELECT id FROM parent_finance), 'Audit Preparation', 'audit-preparation', 'Annual audit preparation and compliance', 'ACTIVE', 'HIGH'),
((SELECT id FROM org), (SELECT id FROM parent_finance), 'Cost Optimization', 'cost-optimization', 'Cost reduction and optimization initiatives', 'ACTIVE', 'MEDIUM'),
((SELECT id FROM org), (SELECT id FROM parent_it), 'System Migration', 'system-migration', 'Legacy system migration to cloud', 'ACTIVE', 'HIGH'),
((SELECT id FROM org), (SELECT id FROM parent_it), 'Security Updates', 'security-updates', 'Security patches and updates', 'ACTIVE', 'CRITICAL'),
((SELECT id FROM org), (SELECT id FROM parent_it), 'Backup Systems', 'backup-systems', 'Data backup and disaster recovery', 'ACTIVE', 'HIGH')
ON CONFLICT (org_id, slug) DO NOTHING;

-- 6) Project Members
WITH org AS (SELECT id FROM organization WHERE slug = 'cloudextel'),
admin_user AS (SELECT id FROM app_user WHERE primary_email = 'admin@admin.com'),
viral_user AS (SELECT id FROM app_user WHERE primary_email = 'viralji@gmail.com'),
john_user AS (SELECT id FROM app_user WHERE primary_email = 'john@cloudextel.com'),
jane_user AS (SELECT id FROM app_user WHERE primary_email = 'jane@cloudextel.com'),
mike_user AS (SELECT id FROM app_user WHERE primary_email = 'mike@cloudextel.com'),
sarah_user AS (SELECT id FROM app_user WHERE primary_email = 'sarah@cloudextel.com'),
david_user AS (SELECT id FROM app_user WHERE primary_email = 'david@cloudextel.com'),
lisa_user AS (SELECT id FROM app_user WHERE primary_email = 'lisa@cloudextel.com'),
tom_user AS (SELECT id FROM app_user WHERE primary_email = 'tom@cloudextel.com'),
amy_user AS (SELECT id FROM app_user WHERE primary_email = 'amy@cloudextel.com'),
bob_user AS (SELECT id FROM app_user WHERE primary_email = 'bob@cloudextel.com'),
emma_user AS (SELECT id FROM app_user WHERE primary_email = 'emma@cloudextel.com'),
chris_user AS (SELECT id FROM app_user WHERE primary_email = 'chris@cloudextel.com'),
anna_user AS (SELECT id FROM app_user WHERE primary_email = 'anna@cloudextel.com'),
mark_user AS (SELECT id FROM app_user WHERE primary_email = 'mark@cloudextel.com')
INSERT INTO project_member (org_id, project_id, user_id, role) VALUES 
-- Budget projects
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'budget-2025'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'budget-2025'), (SELECT id FROM viral_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'budget-2025'), (SELECT id FROM john_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'budget-2025'), (SELECT id FROM jane_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'capex-planning'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'capex-planning'), (SELECT id FROM viral_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'capex-planning'), (SELECT id FROM john_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'opex-management'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'opex-management'), (SELECT id FROM viral_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'opex-management'), (SELECT id FROM jane_user), 'EDITOR'),
-- HR projects
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'hr-initiatives'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'hr-initiatives'), (SELECT id FROM viral_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'hr-initiatives'), (SELECT id FROM mike_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'hr-initiatives'), (SELECT id FROM sarah_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'recruitment-drive'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'recruitment-drive'), (SELECT id FROM mike_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'recruitment-drive'), (SELECT id FROM sarah_user), 'EDITOR'),
-- Sales projects
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'sales-projects'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'sales-projects'), (SELECT id FROM viral_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'sales-projects'), (SELECT id FROM david_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'sales-projects'), (SELECT id FROM lisa_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'lead-generation'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'lead-generation'), (SELECT id FROM david_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'lead-generation'), (SELECT id FROM lisa_user), 'EDITOR'),
-- Finance projects
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'finance-ops'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'finance-ops'), (SELECT id FROM viral_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'finance-ops'), (SELECT id FROM tom_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'finance-ops'), (SELECT id FROM amy_user), 'EDITOR'),
-- IT projects
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'it-infrastructure'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'it-infrastructure'), (SELECT id FROM viral_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'it-infrastructure'), (SELECT id FROM bob_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'it-infrastructure'), (SELECT id FROM emma_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'system-migration'), (SELECT id FROM admin_user), 'ADMIN'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'system-migration'), (SELECT id FROM bob_user), 'EDITOR'),
((SELECT id FROM org), (SELECT id FROM project WHERE slug = 'system-migration'), (SELECT id FROM emma_user), 'EDITOR')
ON CONFLICT (org_id, project_id, user_id) DO NOTHING;

-- 7) Project Settings
WITH org AS (SELECT id FROM organization WHERE slug = 'cloudextel')
INSERT INTO project_settings (org_id, project_id, default_task_due_days, default_task_priority, auto_assign_enabled, notification_enabled)
SELECT (SELECT id FROM org), p.id, 7, 'MEDIUM', false, true
FROM project p
WHERE p.slug IN ('budget-2025', 'hr-initiatives', 'sales-projects', 'finance-ops', 'it-infrastructure')
ON CONFLICT (org_id, project_id) DO NOTHING;

-- 8) Tasks for each project
WITH org AS (SELECT id FROM organization WHERE slug = 'cloudextel'),
projects AS (
  SELECT p.id, p.slug, p.name FROM project p 
  WHERE p.slug IN ('capex-planning', 'opex-management', 'revenue-forecasting', 'recruitment-drive', 'employee-training', 'performance-reviews', 'lead-generation', 'client-onboarding', 'sales-training', 'financial-reporting', 'audit-preparation', 'cost-optimization', 'system-migration', 'security-updates', 'backup-systems')
),
admin_user AS (SELECT id FROM app_user WHERE primary_email = 'admin@admin.com'),
viral_user AS (SELECT id FROM app_user WHERE primary_email = 'viralji@gmail.com'),
john_user AS (SELECT id FROM app_user WHERE primary_email = 'john@cloudextel.com'),
jane_user AS (SELECT id FROM app_user WHERE primary_email = 'jane@cloudextel.com'),
mike_user AS (SELECT id FROM app_user WHERE primary_email = 'mike@cloudextel.com'),
sarah_user AS (SELECT id FROM app_user WHERE primary_email = 'sarah@cloudextel.com'),
david_user AS (SELECT id FROM app_user WHERE primary_email = 'david@cloudextel.com'),
lisa_user AS (SELECT id FROM app_user WHERE primary_email = 'lisa@cloudextel.com'),
tom_user AS (SELECT id FROM app_user WHERE primary_email = 'tom@cloudextel.com'),
amy_user AS (SELECT id FROM app_user WHERE primary_email = 'amy@cloudextel.com'),
bob_user AS (SELECT id FROM app_user WHERE primary_email = 'bob@cloudextel.com'),
emma_user AS (SELECT id FROM app_user WHERE primary_email = 'emma@cloudextel.com')
INSERT INTO task (org_id, project_id, title, description, status, priority, created_by, due_at) VALUES 
-- Capex Planning Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'capex-planning'), 'Hardware Procurement Analysis', 'Analyze hardware requirements and create procurement plan', 'OPEN', 'HIGH', (SELECT id FROM admin_user), NOW() + INTERVAL '30 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'capex-planning'), 'Software License Review', 'Review and optimize software licensing costs', 'IN_PROGRESS', 'MEDIUM', (SELECT id FROM viral_user), NOW() + INTERVAL '15 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'capex-planning'), 'Infrastructure Investment Plan', 'Plan infrastructure investments for next year', 'OPEN', 'HIGH', (SELECT id FROM john_user), NOW() + INTERVAL '45 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'capex-planning'), 'Equipment Depreciation Analysis', 'Analyze current equipment and depreciation schedules', 'BLOCKED', 'LOW', (SELECT id FROM jane_user), NOW() + INTERVAL '20 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'capex-planning'), 'Capital Budget Approval', 'Prepare capital budget for board approval', 'OPEN', 'CRITICAL', (SELECT id FROM admin_user), NOW() + INTERVAL '60 days'),
-- Opex Management Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'opex-management'), 'Monthly Expense Review', 'Review and categorize monthly operational expenses', 'DONE', 'MEDIUM', (SELECT id FROM viral_user), NOW() - INTERVAL '5 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'opex-management'), 'Vendor Contract Negotiation', 'Renegotiate contracts with key vendors', 'IN_PROGRESS', 'HIGH', (SELECT id FROM john_user), NOW() + INTERVAL '25 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'opex-management'), 'Utility Cost Optimization', 'Analyze and optimize utility costs', 'OPEN', 'MEDIUM', (SELECT id FROM jane_user), NOW() + INTERVAL '35 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'opex-management'), 'Travel Expense Policy Update', 'Update travel and expense policies', 'OPEN', 'LOW', (SELECT id FROM admin_user), NOW() + INTERVAL '10 days'),
-- Revenue Forecasting Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'revenue-forecasting'), 'Q1 Revenue Analysis', 'Analyze Q1 revenue performance and trends', 'DONE', 'HIGH', (SELECT id FROM viral_user), NOW() - INTERVAL '10 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'revenue-forecasting'), 'Market Research Update', 'Update market research and competitive analysis', 'IN_PROGRESS', 'MEDIUM', (SELECT id FROM john_user), NOW() + INTERVAL '20 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'revenue-forecasting'), 'Revenue Model Validation', 'Validate and update revenue forecasting models', 'OPEN', 'HIGH', (SELECT id FROM jane_user), NOW() + INTERVAL '40 days'),
-- Recruitment Drive Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'recruitment-drive'), 'Job Posting Creation', 'Create and post job openings for key positions', 'IN_PROGRESS', 'HIGH', (SELECT id FROM mike_user), NOW() + INTERVAL '7 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'recruitment-drive'), 'Candidate Screening Process', 'Develop and implement candidate screening process', 'OPEN', 'MEDIUM', (SELECT id FROM sarah_user), NOW() + INTERVAL '14 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'recruitment-drive'), 'Interview Scheduling', 'Schedule and coordinate interviews with candidates', 'OPEN', 'MEDIUM', (SELECT id FROM mike_user), NOW() + INTERVAL '21 days'),
-- Employee Training Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'employee-training'), 'Training Needs Assessment', 'Assess training needs across all departments', 'DONE', 'MEDIUM', (SELECT id FROM sarah_user), NOW() - INTERVAL '3 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'employee-training'), 'Training Program Development', 'Develop comprehensive training programs', 'IN_PROGRESS', 'HIGH', (SELECT id FROM mike_user), NOW() + INTERVAL '30 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'employee-training'), 'Training Schedule Planning', 'Plan and schedule training sessions', 'OPEN', 'MEDIUM', (SELECT id FROM sarah_user), NOW() + INTERVAL '15 days'),
-- Lead Generation Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'lead-generation'), 'Lead Source Analysis', 'Analyze and optimize lead generation sources', 'IN_PROGRESS', 'HIGH', (SELECT id FROM david_user), NOW() + INTERVAL '10 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'lead-generation'), 'Marketing Campaign Development', 'Develop targeted marketing campaigns', 'OPEN', 'HIGH', (SELECT id FROM lisa_user), NOW() + INTERVAL '20 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'lead-generation'), 'Lead Qualification Process', 'Implement lead qualification and scoring process', 'OPEN', 'MEDIUM', (SELECT id FROM david_user), NOW() + INTERVAL '25 days'),
-- Financial Reporting Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'financial-reporting'), 'Monthly Financial Statements', 'Prepare monthly financial statements', 'DONE', 'HIGH', (SELECT id FROM tom_user), NOW() - INTERVAL '2 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'financial-reporting'), 'Quarterly Board Report', 'Prepare quarterly report for board meeting', 'IN_PROGRESS', 'CRITICAL', (SELECT id FROM amy_user), NOW() + INTERVAL '5 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'financial-reporting'), 'KPI Dashboard Update', 'Update and maintain KPI dashboard', 'OPEN', 'MEDIUM', (SELECT id FROM tom_user), NOW() + INTERVAL '12 days'),
-- System Migration Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'system-migration'), 'Legacy System Assessment', 'Assess current legacy systems and dependencies', 'DONE', 'HIGH', (SELECT id FROM bob_user), NOW() - INTERVAL '7 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'system-migration'), 'Migration Strategy Development', 'Develop comprehensive migration strategy', 'IN_PROGRESS', 'CRITICAL', (SELECT id FROM emma_user), NOW() + INTERVAL '45 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'system-migration'), 'Data Backup and Testing', 'Implement data backup and testing procedures', 'OPEN', 'HIGH', (SELECT id FROM bob_user), NOW() + INTERVAL '30 days'),
-- Security Updates Tasks
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'security-updates'), 'Security Vulnerability Scan', 'Perform comprehensive security vulnerability scan', 'IN_PROGRESS', 'CRITICAL', (SELECT id FROM emma_user), NOW() + INTERVAL '3 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'security-updates'), 'Patch Management Process', 'Implement automated patch management process', 'OPEN', 'HIGH', (SELECT id FROM bob_user), NOW() + INTERVAL '15 days'),
((SELECT id FROM org), (SELECT id FROM projects WHERE slug = 'security-updates'), 'Security Training Update', 'Update security training materials and procedures', 'OPEN', 'MEDIUM', (SELECT id FROM emma_user), NOW() + INTERVAL '20 days')
ON CONFLICT DO NOTHING;

-- 9) Task Assignments
WITH org AS (SELECT id FROM organization WHERE slug = 'cloudextel'),
tasks AS (
  SELECT t.id, t.title FROM task t 
  JOIN project p ON t.project_id = p.id 
  WHERE p.slug IN ('capex-planning', 'opex-management', 'revenue-forecasting', 'recruitment-drive', 'employee-training', 'lead-generation', 'financial-reporting', 'system-migration', 'security-updates')
),
john_user AS (SELECT id FROM app_user WHERE primary_email = 'john@cloudextel.com'),
jane_user AS (SELECT id FROM app_user WHERE primary_email = 'jane@cloudextel.com'),
mike_user AS (SELECT id FROM app_user WHERE primary_email = 'mike@cloudextel.com'),
sarah_user AS (SELECT id FROM app_user WHERE primary_email = 'sarah@cloudextel.com'),
david_user AS (SELECT id FROM app_user WHERE primary_email = 'david@cloudextel.com'),
lisa_user AS (SELECT id FROM app_user WHERE primary_email = 'lisa@cloudextel.com'),
tom_user AS (SELECT id FROM app_user WHERE primary_email = 'tom@cloudextel.com'),
amy_user AS (SELECT id FROM app_user WHERE primary_email = 'amy@cloudextel.com'),
bob_user AS (SELECT id FROM app_user WHERE primary_email = 'bob@cloudextel.com'),
emma_user AS (SELECT id FROM app_user WHERE primary_email = 'emma@cloudextel.com')
INSERT INTO task_assignment (org_id, task_id, user_id) VALUES 
-- Assign tasks to users
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Hardware Procurement Analysis'), (SELECT id FROM john_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Software License Review'), (SELECT id FROM jane_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Infrastructure Investment Plan'), (SELECT id FROM john_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Equipment Depreciation Analysis'), (SELECT id FROM jane_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Monthly Expense Review'), (SELECT id FROM john_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Vendor Contract Negotiation'), (SELECT id FROM jane_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Q1 Revenue Analysis'), (SELECT id FROM john_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Market Research Update'), (SELECT id FROM jane_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Job Posting Creation'), (SELECT id FROM mike_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Candidate Screening Process'), (SELECT id FROM sarah_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Training Needs Assessment'), (SELECT id FROM sarah_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Training Program Development'), (SELECT id FROM mike_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Lead Source Analysis'), (SELECT id FROM david_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Marketing Campaign Development'), (SELECT id FROM lisa_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Monthly Financial Statements'), (SELECT id FROM tom_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Quarterly Board Report'), (SELECT id FROM amy_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Legacy System Assessment'), (SELECT id FROM bob_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Migration Strategy Development'), (SELECT id FROM emma_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Security Vulnerability Scan'), (SELECT id FROM emma_user)),
((SELECT id FROM org), (SELECT id FROM tasks WHERE title = 'Patch Management Process'), (SELECT id FROM bob_user))
ON CONFLICT (org_id, task_id, user_id) DO NOTHING;

-- 10) Task Comments
WITH org AS (SELECT id FROM organization WHERE slug = 'cloudextel'),
tasks AS (
  SELECT t.id FROM task t 
  JOIN project p ON t.project_id = p.id 
  WHERE p.slug IN ('capex-planning', 'opex-management', 'recruitment-drive', 'system-migration')
  LIMIT 5
),
john_user AS (SELECT id FROM app_user WHERE primary_email = 'john@cloudextel.com'),
jane_user AS (SELECT id FROM app_user WHERE primary_email = 'jane@cloudextel.com'),
mike_user AS (SELECT id FROM app_user WHERE primary_email = 'mike@cloudextel.com'),
sarah_user AS (SELECT id FROM app_user WHERE primary_email = 'sarah@cloudextel.com'),
bob_user AS (SELECT id FROM app_user WHERE primary_email = 'bob@cloudextel.com')
INSERT INTO task_comment (org_id, task_id, author_id, content) VALUES 
((SELECT id FROM org), (SELECT id FROM tasks LIMIT 1), (SELECT id FROM john_user), 'This task is progressing well. Need to gather more requirements from stakeholders.'),
((SELECT id FROM org), (SELECT id FROM tasks LIMIT 1), (SELECT id FROM jane_user), 'I have completed the initial analysis. Waiting for feedback from the team.'),
((SELECT id FROM org), (SELECT id FROM tasks LIMIT 1 OFFSET 1), (SELECT id FROM mike_user), 'Great progress on this initiative. Looking forward to the next phase.'),
((SELECT id FROM org), (SELECT id FROM tasks LIMIT 1 OFFSET 1), (SELECT id FROM sarah_user), 'We need to schedule a meeting to discuss the next steps.'),
((SELECT id FROM org), (SELECT id FROM tasks LIMIT 1 OFFSET 2), (SELECT id FROM bob_user), 'Technical implementation is on track. No blockers identified.')
ON CONFLICT DO NOTHING;
