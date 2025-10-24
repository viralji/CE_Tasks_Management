# Database Schema Documentation

## Overview
This document describes the complete database schema for the CE Tasks Management System. The database is designed for multi-tenant architecture with organization-based data isolation.

## Core Tables

### 1. Organization Management

#### `organization`
Stores organization information for multi-tenant support.

```sql
CREATE TABLE organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique organization identifier
- `name`: Organization display name
- `slug`: URL-friendly organization identifier
- `created_at`: Organization creation timestamp
- `updated_at`: Last modification timestamp

#### `app_user`
Stores user account information.

```sql
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    primary_email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique user identifier
- `name`: User's display name
- `primary_email`: User's email address (unique)
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp

#### `organization_membership`
Links users to organizations with roles.

```sql
CREATE TABLE organization_membership (
    org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
    role membership_role DEFAULT 'MEMBER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);
```

**Fields:**
- `org_id`: Organization reference
- `user_id`: User reference
- `role`: User's role in organization (ADMIN, MEMBER)
- `joined_at`: Membership creation timestamp

### 2. Project Management

#### `project`
Stores project information within organizations.

```sql
CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'ACTIVE',
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES app_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, slug)
);
```

**Fields:**
- `id`: Unique project identifier
- `org_id`: Parent organization
- `name`: Project display name
- `slug`: URL-friendly project identifier
- `description`: Project description
- `status`: Project status (ACTIVE, COMPLETED, ARCHIVED)
- `start_at`: Project start date
- `end_at`: Project end date
- `created_by`: Project creator
- `created_at`: Project creation timestamp
- `updated_at`: Last modification timestamp

#### `project_member`
Manages project team membership.

```sql
CREATE TABLE project_member (
    org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    project_id UUID REFERENCES project(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
    role membership_role DEFAULT 'VIEWER',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (org_id, project_id, user_id)
);
```

**Fields:**
- `org_id`: Organization reference
- `project_id`: Project reference
- `user_id`: User reference
- `role`: User's role in project (ADMIN, MEMBER, VIEWER)
- `added_at`: Membership creation timestamp

### 3. Task Management

#### `task`
Core task entity with all task information.

```sql
CREATE TABLE task (
    org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES project(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'OPEN',
    priority task_priority DEFAULT 'MEDIUM',
    due_at TIMESTAMP WITH TIME ZONE,
    sla_hours INTEGER,
    created_by UUID REFERENCES app_user(id),
    updated_by UUID REFERENCES app_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Fields:**
- `org_id`: Organization reference
- `id`: Unique task identifier
- `project_id`: Parent project
- `title`: Task title
- `description`: Task description
- `status`: Task status (OPEN, IN_PROGRESS, BLOCKED, DONE, CANCELED)
- `priority`: Task priority (LOW, MEDIUM, HIGH, URGENT)
- `due_at`: Task due date
- `sla_hours`: SLA in hours
- `created_by`: Task creator
- `updated_by`: Last modifier
- `created_at`: Task creation timestamp
- `updated_at`: Last modification timestamp
- `deleted_at`: Soft delete timestamp

#### `task_assignment`
Assigns users to tasks.

```sql
CREATE TABLE task_assignment (
    org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    task_id UUID REFERENCES task(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (org_id, task_id, user_id)
);
```

**Fields:**
- `org_id`: Organization reference
- `task_id`: Task reference
- `user_id`: Assigned user
- `assigned_at`: Assignment timestamp

#### `task_comment`
Stores task comments.

```sql
CREATE TABLE task_comment (
    org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES task(id) ON DELETE CASCADE,
    author_id UUID REFERENCES app_user(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `org_id`: Organization reference
- `id`: Unique comment identifier
- `task_id`: Parent task
- `author_id`: Comment author
- `content`: Comment text
- `created_at`: Comment timestamp

#### `task_status_log`
Tracks status change history.

```sql
CREATE TABLE task_status_log (
    org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES task(id) ON DELETE CASCADE,
    from_status task_status,
    to_status task_status NOT NULL,
    changed_by UUID REFERENCES app_user(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `org_id`: Organization reference
- `id`: Unique log entry identifier
- `task_id`: Task reference
- `from_status`: Previous status
- `to_status`: New status
- `changed_by`: User who made the change
- `changed_at`: Change timestamp

### 4. Project Settings

#### `project_settings`
Stores project-specific configuration.

```sql
CREATE TABLE project_settings (
    org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    project_id UUID REFERENCES project(id) ON DELETE CASCADE,
    default_task_priority task_priority DEFAULT 'MEDIUM',
    default_task_due_days INTEGER DEFAULT 7,
    auto_assign_enabled BOOLEAN DEFAULT FALSE,
    auto_assign_user_id UUID REFERENCES app_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (org_id, project_id)
);
```

**Fields:**
- `org_id`: Organization reference
- `project_id`: Project reference
- `default_task_priority`: Default priority for new tasks
- `default_task_due_days`: Default due date offset in days
- `auto_assign_enabled`: Auto-assignment feature flag
- `auto_assign_user_id`: Default assignee for auto-assignment
- `created_at`: Settings creation timestamp
- `updated_at`: Last modification timestamp

## Enums

### `membership_role`
```sql
CREATE TYPE membership_role AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');
```

### `project_status`
```sql
CREATE TYPE project_status AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
```

### `task_status`
```sql
CREATE TYPE task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED');
```

### `task_priority`
```sql
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
```

## Indexes

### Performance Indexes
```sql
-- Organization-based queries
CREATE INDEX idx_task_org_id ON task(org_id);
CREATE INDEX idx_project_org_id ON project(org_id);
CREATE INDEX idx_task_assignment_org_id ON task_assignment(org_id);

-- User-based queries
CREATE INDEX idx_task_assignment_user_id ON task_assignment(user_id);
CREATE INDEX idx_organization_membership_user_id ON organization_membership(user_id);

-- Project-based queries
CREATE INDEX idx_task_project_id ON task(project_id);
CREATE INDEX idx_project_member_project_id ON project_member(project_id);

-- Status and priority queries
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_priority ON task(priority);

-- Date-based queries
CREATE INDEX idx_task_due_at ON task(due_at);
CREATE INDEX idx_task_created_at ON task(created_at);
```

## Relationships

### Entity Relationship Diagram
```
Organization (1) ── (N) OrganizationMembership (N) ── (1) User
Organization (1) ── (N) Project
Project (1) ── (N) Task
Project (1) ── (N) ProjectMember (N) ── (1) User
Task (1) ── (N) TaskAssignment (N) ── (1) User
Task (1) ── (N) TaskComment
Task (1) ── (N) TaskStatusLog
```

### Key Constraints
- All operations are scoped by `org_id` for multi-tenancy
- Soft deletes use `deleted_at` timestamp
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate relationships

## Data Flow

### Task Lifecycle
1. **Creation**: Task created in `OPEN` status
2. **Assignment**: Users assigned via `task_assignment`
3. **Status Changes**: Tracked in `task_status_log`
4. **Comments**: Added via `task_comment`
5. **Completion**: Status changed to `DONE` or `CANCELED`

### Multi-tenancy
- All queries include `org_id` filter
- User access controlled by `organization_membership`
- Project access controlled by `project_member`
- Task access controlled by `task_assignment`

## Security Considerations

### Data Isolation
- Organization-based data segregation
- User access limited to assigned tasks
- Project access limited to project members
- All API endpoints validate organization membership

### Audit Trail
- Status changes logged in `task_status_log`
- Comments tracked with author and timestamp
- Soft deletes preserve data for recovery
- All modifications include `updated_at` timestamps

---

**Schema Version**: 1.0  
**Last Updated**: October 2025  
**Compatible With**: PostgreSQL 12+
