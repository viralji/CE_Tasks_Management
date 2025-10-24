import { withOrg } from '@/lib/db';

export interface ProjectSettings {
  defaultTaskDueDays: number;
  defaultTaskPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoAssignEnabled: boolean;
  autoAssignUserId?: string;
  notificationEnabled: boolean;
  notificationOnTaskCreate: boolean;
  notificationOnTaskComplete: boolean;
  notificationOnComment: boolean;
}

export async function listProjects(orgId: string, userId: string, statusFilter: 'open' | 'closed' | 'all' = 'open', isSuperAdmin: boolean = false) {
  return withOrg(orgId, async (client) => {
    let sql: string;
    const params: any[] = [orgId];
    
    if (isSuperAdmin) {
      // Super admin can see all projects in the organization
      sql = `
        SELECT DISTINCT p.id, p.name, p.slug, p.parent_id, p.status, p.start_at, p.end_at, p.severity, p.description, p.created_at
        FROM project p
        WHERE p.org_id = $1 
        AND p.deleted_at IS NULL
      `;
    } else {
      // Regular users can only see projects they're members of
      sql = `
        SELECT DISTINCT p.id, p.name, p.slug, p.parent_id, p.status, p.start_at, p.end_at, p.severity, p.description, p.created_at
        FROM project p
        INNER JOIN project_member pm ON p.id = pm.project_id AND p.org_id = pm.org_id
        WHERE p.org_id = $1 
        AND pm.user_id = $2
        AND p.deleted_at IS NULL
      `;
      params.push(userId);
    }
    
    if (statusFilter === 'open') {
      sql += ` AND (p.status IS DISTINCT FROM 'COMPLETED' AND p.status IS DISTINCT FROM 'CANCELED')`;
    } else if (statusFilter === 'closed') {
      sql += ` AND (p.status = 'COMPLETED' OR p.status = 'CANCELED')`;
    }
    
    sql += ` ORDER BY p.created_at DESC LIMIT 200`;
    const { rows } = await client.query(sql, params);
    return rows;
  });
}

export async function createProject(
  orgId: string,
  data: {
    name: string;
    slug: string;
    parentId?: string;
    startAt?: string;
    endAt?: string;
    severity?: string;
    status?: string;
    description?: string;
    createdBy?: string;
    settings?: Partial<ProjectSettings>;
  }
) {
  return withOrg(orgId, async (client) => {
    // Insert project
    const { rows } = await client.query(
      `INSERT INTO project (org_id, name, slug, parent_id, start_at, end_at, severity, status, description, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id, name, slug, parent_id, start_at, end_at, severity, status, description`,
      [
        orgId, 
        data.name, 
        data.slug, 
        data.parentId ?? null,
        data.startAt ?? null,
        data.endAt ?? null,
        data.severity ?? 'MEDIUM',
        data.status ?? 'ACTIVE',
        data.description ?? null,
        data.createdBy ?? null
      ]
    );
    
    const project = rows[0];
    
    // Create default settings
    const settings = {
      defaultTaskDueDays: 2,
      defaultTaskPriority: 'MEDIUM' as const,
      autoAssignEnabled: false,
      notificationEnabled: true,
      notificationOnTaskCreate: true,
      notificationOnTaskComplete: true,
      notificationOnComment: true,
      ...data.settings
    };
    
    await client.query(
      `INSERT INTO project_settings (org_id, project_id, default_task_due_days, default_task_priority, auto_assign_enabled, auto_assign_user_id, notification_enabled, notification_on_task_create, notification_on_task_complete, notification_on_comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        orgId,
        project.id,
        settings.defaultTaskDueDays,
        settings.defaultTaskPriority,
        settings.autoAssignEnabled,
        settings.autoAssignUserId ?? null,
        settings.notificationEnabled,
        settings.notificationOnTaskCreate,
        settings.notificationOnTaskComplete,
        settings.notificationOnComment
      ]
    );
    
    // Add the creator as an ADMIN member of the project
    if (data.createdBy) {
      await client.query(
        `INSERT INTO project_member (org_id, project_id, user_id, role, added_at)
         VALUES ($1, $2, $3, 'ADMIN', now())
         ON CONFLICT (org_id, project_id, user_id) DO NOTHING`,
        [orgId, project.id, data.createdBy]
      );
    }
    
    // Inherit members from parent project if parentId is provided
    if (data.parentId) {
      const { inheritMembersFromParent } = await import('./project-hierarchy');
      await inheritMembersFromParent(orgId, project.id, data.parentId);
    }
    
    return project;
  });
}

export async function getProject(orgId: string, id: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT id, name, slug, parent_id, status, start_at, end_at, severity, description, created_at, updated_at 
       FROM project WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
      [orgId, id]
    );
    return rows[0] || null;
  });
}

export async function updateProject(
  orgId: string,
  projectId: string,
  updates: {
    name?: string;
    startAt?: string;
    endAt?: string;
    severity?: string;
    status?: string;
    description?: string;
  }
) {
  return withOrg(orgId, async (client) => {
    const setClause = Object.keys(updates)
      .map((key, index) => {
        const columnMap: { [key: string]: string } = {
          startAt: 'start_at',
          endAt: 'end_at'
        };
        return `${columnMap[key] || key} = $${index + 3}`;
      })
      .join(', ');
    
    const values = Object.values(updates).filter(v => v !== undefined);
    
    const { rows } = await client.query(
      `UPDATE project SET ${setClause}, updated_at = now() 
       WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
       RETURNING id, name, slug, parent_id, status, start_at, end_at, severity, description`,
      [orgId, projectId, ...values]
    );
    return rows[0];
  });
}

export async function getProjectSettings(orgId: string, projectId: string): Promise<ProjectSettings> {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT default_task_due_days, default_task_priority, auto_assign_enabled, auto_assign_user_id,
              notification_enabled, notification_on_task_create, notification_on_task_complete, notification_on_comment
       FROM project_settings WHERE org_id = $1 AND project_id = $2`,
      [orgId, projectId]
    );
    
    if (rows.length === 0) {
      // Return default settings if none exist
      return {
        defaultTaskDueDays: 2,
        defaultTaskPriority: 'MEDIUM',
        autoAssignEnabled: false,
        notificationEnabled: true,
        notificationOnTaskCreate: true,
        notificationOnTaskComplete: true,
        notificationOnComment: true
      };
    }
    
    const row = rows[0];
    return {
      defaultTaskDueDays: row.default_task_due_days,
      defaultTaskPriority: row.default_task_priority,
      autoAssignEnabled: row.auto_assign_enabled,
      autoAssignUserId: row.auto_assign_user_id,
      notificationEnabled: row.notification_enabled,
      notificationOnTaskCreate: row.notification_on_task_create,
      notificationOnTaskComplete: row.notification_on_task_complete,
      notificationOnComment: row.notification_on_comment
    };
  });
}

export async function updateProjectSettings(
  orgId: string,
  projectId: string,
  settings: Partial<ProjectSettings>
) {
  return withOrg(orgId, async (client) => {
    const setClause = Object.keys(settings)
      .map((key, index) => {
        const columnMap: { [key: string]: string } = {
          defaultTaskDueDays: 'default_task_due_days',
          defaultTaskPriority: 'default_task_priority',
          autoAssignEnabled: 'auto_assign_enabled',
          autoAssignUserId: 'auto_assign_user_id',
          notificationEnabled: 'notification_enabled',
          notificationOnTaskCreate: 'notification_on_task_create',
          notificationOnTaskComplete: 'notification_on_task_complete',
          notificationOnComment: 'notification_on_comment'
        };
        return `${columnMap[key] || key} = $${index + 3}`;
      })
      .join(', ');
    
    const values = Object.values(settings).filter(v => v !== undefined);
    
    const { rows } = await client.query(
      `UPDATE project_settings SET ${setClause}, updated_at = now() 
       WHERE org_id = $1 AND project_id = $2
       RETURNING *`,
      [orgId, projectId, ...values]
    );
    return rows[0];
  });
}

export async function listProjectsByParent(orgId: string, parentId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT id, name, slug, parent_id, status, start_at, end_at, severity, description FROM project 
       WHERE org_id = $1 AND parent_id = $2 AND deleted_at IS NULL 
       ORDER BY created_at DESC`,
      [orgId, parentId]
    );
    return rows;
  });
}

/**
 * Check if user has access to a project
 */
export async function checkProjectAccess(orgId: string, projectId: string, userId: string, isSuperAdmin: boolean = false): Promise<boolean> {
  if (isSuperAdmin) {
    return true; // Super admin has access to everything
  }
  
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT 1 FROM project_member 
       WHERE org_id = $1 AND project_id = $2 AND user_id = $3`,
      [orgId, projectId, userId]
    );
    return rows.length > 0;
  });
}

/**
 * Delete a project and all related data
 */
export async function deleteProject(orgId: string, projectId: string) {
  return withOrg(orgId, async (client) => {
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Delete in correct order to handle foreign key constraints
      // Delete task-related data first
      await client.query('DELETE FROM task_comment WHERE org_id = $1 AND task_id IN (SELECT id FROM task WHERE project_id = $2)', [orgId, projectId]);
      await client.query('DELETE FROM task_attachment WHERE org_id = $1 AND task_id IN (SELECT id FROM task WHERE project_id = $2)', [orgId, projectId]);
      await client.query('DELETE FROM task_status_log WHERE org_id = $1 AND task_id IN (SELECT id FROM task WHERE project_id = $2)', [orgId, projectId]);
      await client.query('DELETE FROM task_assignment WHERE org_id = $1 AND task_id IN (SELECT id FROM task WHERE project_id = $2)', [orgId, projectId]);
      await client.query('DELETE FROM task_watcher WHERE org_id = $1 AND task_id IN (SELECT id FROM task WHERE project_id = $2)', [orgId, projectId]);
      await client.query('DELETE FROM task WHERE org_id = $1 AND project_id = $2', [orgId, projectId]);
      
      // Delete project-related data
      await client.query('DELETE FROM project_member WHERE org_id = $1 AND project_id = $2', [orgId, projectId]);
      await client.query('DELETE FROM project_settings WHERE org_id = $1 AND project_id = $2', [orgId, projectId]);
      await client.query('DELETE FROM project_access WHERE org_id = $1 AND project_id = $2', [orgId, projectId]);
      
      // Delete child projects first (recursive)
      const childProjects = await client.query('SELECT id FROM project WHERE org_id = $1 AND parent_id = $2', [orgId, projectId]);
      for (const child of childProjects.rows) {
        await deleteProject(orgId, child.id);
      }
      
      // Finally delete the project itself
      await client.query('DELETE FROM project WHERE org_id = $1 AND id = $2', [orgId, projectId]);
      
      // Commit transaction
      await client.query('COMMIT');
      
      return { success: true };
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
  });
}


