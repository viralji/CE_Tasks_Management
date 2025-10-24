import { withOrg } from '@/lib/db';

export async function listTasksByProject(orgId: string, projectId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT id, title, status, priority, description, due_at, created_by, created_at, updated_at
       FROM task 
       WHERE org_id = $1 AND project_id = $2 AND deleted_at IS NULL 
       ORDER BY created_at DESC LIMIT 500`,
      [orgId, projectId]
    );
    return rows;
  });
}

export async function getTasksByStatus(orgId: string, projectId: string, userId?: string, isSuperAdmin?: boolean) {
  return withOrg(orgId, async (client) => {
    // If user is super admin, return all tasks
    if (isSuperAdmin) {
      const { rows } = await client.query(
        `SELECT id, title, status, priority, description, due_at, created_by, created_at, updated_at
         FROM task 
         WHERE org_id = $1 AND project_id = $2 AND deleted_at IS NULL 
         ORDER BY 
           CASE status 
             WHEN 'OPEN' THEN 1
             WHEN 'IN_PROGRESS' THEN 2
             WHEN 'BLOCKED' THEN 3
             WHEN 'DONE' THEN 4
             WHEN 'CANCELED' THEN 5
           END,
           created_at DESC`,
        [orgId, projectId]
      );
      return rows;
    }

    // For regular users, only return tasks assigned to them
    if (userId) {
      const { rows } = await client.query(
        `SELECT t.id, t.title, t.status, t.priority, t.description, t.due_at, t.created_by, t.created_at, t.updated_at
         FROM task t
         LEFT JOIN task_assignment ta ON t.id = ta.task_id AND t.org_id = ta.org_id
         WHERE t.org_id = $1 AND t.project_id = $2 AND t.deleted_at IS NULL 
         AND (ta.user_id = $3 OR t.created_by = $3)
         GROUP BY t.id, t.title, t.status, t.priority, t.description, t.due_at, t.created_by, t.created_at, t.updated_at
         ORDER BY 
           CASE t.status 
             WHEN 'OPEN' THEN 1
             WHEN 'IN_PROGRESS' THEN 2
             WHEN 'BLOCKED' THEN 3
             WHEN 'DONE' THEN 4
             WHEN 'CANCELED' THEN 5
           END,
           t.created_at DESC`,
        [orgId, projectId, userId]
      );
      return rows;
    }

    // Fallback: return empty array if no user specified
    return [];
  });
}

export async function getTask(orgId: string, taskId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT id, title, status, priority, description, due_at, created_by, created_at, updated_at
       FROM task 
       WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
      [orgId, taskId]
    );
    return rows[0] || null;
  });
}

export async function createTask(orgId: string, projectId: string, title: string, description?: string, priority?: 'LOW'|'MEDIUM'|'HIGH'|'URGENT', dueAt?: string, createdBy?: string, status?: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO task (org_id, project_id, title, description, priority, due_at, created_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, title, status, priority, description, due_at, created_by, created_at`,
      [orgId, projectId, title, description, priority, dueAt, createdBy, status || 'OPEN']
    );
    return rows[0];
  });
}

export async function updateTask(orgId: string, taskId: string, updates: {
  title?: string;
  description?: string;
  status?: 'OPEN'|'IN_PROGRESS'|'BLOCKED'|'DONE'|'CANCELED';
  priority?: 'LOW'|'MEDIUM'|'HIGH'|'URGENT';
  dueAt?: string;
}) {
  return withOrg(orgId, async (client) => {
    // Map JavaScript property names to database column names
    const columnMap: { [key: string]: string } = {
      dueAt: 'due_at'
    };
    
    const setClause = Object.keys(updates)
      .map((key, index) => `${columnMap[key] || key} = $${index + 3}`)
      .join(', ');
    const values = Object.values(updates).filter(v => v !== undefined);
    
    const { rows } = await client.query(
      `UPDATE task SET ${setClause}, updated_at = now() 
       WHERE org_id = $1 AND id = $2 
       RETURNING id, title, status, priority, description, due_at, created_by, created_at, updated_at`,
      [orgId, taskId, ...values]
    );
    return rows[0];
  });
}

export async function updateTaskStatus(orgId: string, taskId: string, status: 'OPEN'|'IN_PROGRESS'|'BLOCKED'|'DONE'|'CANCELED', changedBy?: string) {
  return withOrg(orgId, async (client) => {
    // Get current status for logging
    const { rows: currentRows } = await client.query(
      `SELECT status FROM task WHERE org_id = $1 AND id = $2`,
      [orgId, taskId]
    );
    const currentStatus = currentRows[0]?.status;

    // Update task status
    const { rows } = await client.query(
      `UPDATE task SET status = $1, updated_at = now() 
       WHERE org_id = $2 AND id = $3 
       RETURNING id, title, status, priority, description, due_at, created_by, created_at, updated_at`,
      [status, orgId, taskId]
    );

    // Log status change
    if (currentStatus !== status) {
      await client.query(
        `INSERT INTO task_status_log (org_id, task_id, from_status, to_status, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [orgId, taskId, currentStatus, status, changedBy]
      );
    }

    return rows[0];
  });
}

export async function getTaskStatusLog(orgId: string, taskId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT tsl.from_status, tsl.to_status, tsl.changed_at, u.name as changed_by_name, u.image as changed_by_image
       FROM task_status_log tsl
       LEFT JOIN app_user u ON u.id = tsl.changed_by
       WHERE tsl.org_id = $1 AND tsl.task_id = $2
       ORDER BY tsl.changed_at ASC`,
      [orgId, taskId]
    );
    return rows;
  });
}

export async function getTaskAssignments(orgId: string, taskId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT u.id, u.name, u.image, u.primary_email
       FROM task_assignment ta
       JOIN app_user u ON u.id = ta.user_id
       WHERE ta.org_id = $1 AND ta.task_id = $2
       ORDER BY u.name ASC`,
      [orgId, taskId]
    );
    return rows;
  });
}

export async function assignUsersToTask(orgId: string, taskId: string, userIds: string[]) {
  return withOrg(orgId, async (client) => {
    // Remove existing assignments
    await client.query(
      `DELETE FROM task_assignment WHERE org_id = $1 AND task_id = $2`,
      [orgId, taskId]
    );

    // Add new assignments
    if (userIds.length > 0) {
      const values = userIds.map((_, index) => `($1, $2, $${index + 3})`).join(', ');
      await client.query(
        `INSERT INTO task_assignment (org_id, task_id, user_id) VALUES ${values}`,
        [orgId, taskId, ...userIds]
      );
    }

    return { success: true };
  });
}

export async function requestTaskClosure(orgId: string, taskId: string, requestedBy: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO task_closure_request (org_id, task_id, requested_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (org_id, task_id, requested_by) DO NOTHING
       RETURNING *`,
      [orgId, taskId, requestedBy]
    );
    return rows[0];
  });
}

export async function getTaskClosureRequests(orgId: string, taskId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT tcr.requested_at, u.name as requested_by_name, u.image as requested_by_image
       FROM task_closure_request tcr
       JOIN app_user u ON u.id = tcr.requested_by
       WHERE tcr.org_id = $1 AND tcr.task_id = $2
       ORDER BY tcr.requested_at ASC`,
      [orgId, taskId]
    );
    return rows;
  });
}




/**
 * Check if user has access to a task
 */
export async function checkTaskAccess(orgId: string, taskId: string, userId: string, isSuperAdmin: boolean = false): Promise<boolean> {
  if (isSuperAdmin) {
    return true; // Super admin has access to everything
  }
  
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT 1 FROM task t
       LEFT JOIN task_assignment ta ON t.id = ta.task_id AND t.org_id = ta.org_id
       WHERE t.org_id = $1 
       AND t.id = $2 
       AND (t.created_by = $3 OR ta.user_id = $3)`,
      [orgId, taskId, userId]
    );
    return rows.length > 0;
  });
}
