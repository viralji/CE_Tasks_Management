# Super Admin System Guide

## Overview

The CE Tasks Management System includes a super admin account that has full access to all organizations, projects, and tasks in the system. This account bypasses all access controls and is designed for system administration purposes.

## Super Admin Credentials

- **Email**: `admin`
- **Password**: `admin`
- **Role**: System Administrator
- **Access Level**: Full system access

## Super Admin Capabilities

### ✅ **Full Access**
- **All Organizations**: Can view and manage all organizations
- **All Projects**: Can see all projects regardless of membership
- **All Tasks**: Can view and manage all tasks
- **All Chat Messages**: Can access all project chat rooms
- **All Users**: Can view and manage all users
- **System Settings**: Can modify system-wide settings

### ✅ **Bypasses Access Controls**
- **Project Membership**: Not required to access any project
- **Task Assignment**: Not required to view any task
- **Organization Membership**: Can access all organizations
- **Chat Access**: Can access all project chat rooms

## Security Features

### 🔒 **Authentication**
- Super admin login is handled separately from regular user authentication
- Uses special credentials: `admin/admin`
- Session includes `isSuperAdmin: true` flag

### 🔒 **Access Control Bypass**
- All `checkProjectAccess()` calls return `true` for super admin
- All `checkTaskAccess()` calls return `true` for super admin
- Project listing shows all projects in the organization
- No membership validation required

## Implementation Details

### **Authentication Flow**
```typescript
// In lib/auth.ts
if (credentials.email === 'admin' && credentials.password === 'admin') {
  return {
    id: 'super-admin',
    email: 'admin@system',
    name: 'System Administrator',
    org: defaultOrgId,
    isSuperAdmin: true
  };
}
```

### **Access Control Bypass**
```typescript
// In lib/data/projects.ts
export async function checkProjectAccess(orgId: string, projectId: string, userId: string, isSuperAdmin: boolean = false): Promise<boolean> {
  if (isSuperAdmin) {
    return true; // Super admin has access to everything
  }
  // ... regular access control logic
}
```

### **Project Listing**
```typescript
// In lib/data/projects.ts
if (isSuperAdmin) {
  // Super admin can see all projects in the organization
  sql = `SELECT DISTINCT p.id, p.name, p.slug, p.parent_id, p.status, p.start_at, p.end_at, p.severity, p.description, p.created_at
         FROM project p
         WHERE p.org_id = $1 
         AND p.deleted_at IS NULL`;
} else {
  // Regular users can only see projects they're members of
  sql = `SELECT DISTINCT p.id, p.name, p.slug, p.parent_id, p.status, p.start_at, p.end_at, p.severity, p.description, p.created_at
         FROM project p
         INNER JOIN project_member pm ON p.id = pm.project_id AND p.org_id = pm.org_id
         WHERE p.org_id = $1 
         AND pm.user_id = $2
         AND p.deleted_at IS NULL`;
}
```

## Usage Instructions

### **1. Sign In as Super Admin**
1. Go to `http://localhost:3000/signin`
2. Enter:
   - **Username/Email**: `admin` (no @ required)
   - **Password**: `admin`
3. Click "Continue"

### **2. Access All Projects**
- Navigate to `/projects`
- You will see ALL projects in the organization
- No membership restrictions apply

### **3. Access Any Project**
- Click on any project to view details
- Access all project features:
  - Tasks
  - Members
  - Chat
  - Settings

### **4. Access All Tasks**
- Navigate to `/tasks` (My Tasks)
- View all tasks across all projects
- No assignment restrictions

## API Endpoints with Super Admin Support

All project-related API endpoints support super admin access:

- ✅ `/api/projects` - Lists all projects
- ✅ `/api/projects/[projectId]` - Access any project
- ✅ `/api/projects/[projectId]/tasks` - Access any project's tasks
- ✅ `/api/projects/[projectId]/members` - Access any project's members
- ✅ `/api/projects/[projectId]/chat/messages` - Access any project's chat
- ✅ `/api/projects/[projectId]/settings` - Access any project's settings

## Security Considerations

### ⚠️ **Important Notes**
- Super admin credentials are hardcoded for development
- In production, consider using environment variables
- Super admin has unlimited access - use responsibly
- Consider implementing audit logging for super admin actions

### 🔒 **Future Enhancements**
- Environment-based super admin credentials
- Audit logging for super admin actions
- Super admin activity monitoring
- Role-based permissions within super admin

## Testing

### **Test Super Admin Access**
1. Sign in as super admin (`admin/admin`)
2. Verify you can see all projects
3. Verify you can access any project
4. Verify you can see all tasks
5. Verify you can access any chat room

### **Test Regular User Restrictions**
1. Sign in as regular user (`v.shah@cloudextel.com`)
2. Verify you only see projects you're a member of
3. Verify you cannot access projects you're not a member of
4. Verify access controls work properly

## Troubleshooting

### **Common Issues**
- **Cannot sign in**: Verify credentials are exactly `admin/admin`
- **No projects visible**: Check if organization has projects
- **Access denied**: Verify super admin session is active
- **Session expired**: Sign in again with `admin/admin`

### **Debug Steps**
1. Check browser console for errors
2. Verify session contains `isSuperAdmin: true`
3. Check server logs for authentication messages
4. Verify database connection is working

---

**Note**: This super admin system is designed for system administration and should be used responsibly. It provides full access to all data in the system.
