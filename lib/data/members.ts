import { withOrg } from '@/lib/db';

export async function listProjectMembers(orgId: string, projectId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT u.id, u.primary_email, u.name, u.image, pm.role, pm.added_at
       FROM project_member pm
       JOIN app_user u ON u.id = pm.user_id
       WHERE pm.org_id = $1 AND pm.project_id = $2
       ORDER BY pm.added_at ASC`,
      [orgId, projectId]
    );
    return rows;
  });
}

export async function addProjectMember(orgId: string, projectId: string, userId: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER' = 'VIEWER') {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO project_member (org_id, project_id, user_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (org_id, project_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [orgId, projectId, userId, role]
    );
    return rows[0];
  });
}

export async function removeProjectMember(orgId: string, projectId: string, userId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `DELETE FROM project_member 
       WHERE org_id = $1 AND project_id = $2 AND user_id = $3
       RETURNING *`,
      [orgId, projectId, userId]
    );
    return rows[0];
  });
}

export async function getProjectMember(orgId: string, projectId: string, userId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT * FROM project_member 
       WHERE org_id = $1 AND project_id = $2 AND user_id = $3`,
      [orgId, projectId, userId]
    );
    return rows[0] || null;
  });
}

export async function listUsersNotInProject(orgId: string, projectId: string) {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `SELECT u.id, u.primary_email, u.name, u.image
       FROM app_user u
       JOIN organization_membership om ON om.user_id = u.id
       WHERE om.org_id = $1 
       AND u.id NOT IN (
         SELECT pm.user_id FROM project_member pm 
         WHERE pm.org_id = $1 AND pm.project_id = $2
       )
       ORDER BY u.name ASC`,
      [orgId, projectId]
    );
    return rows;
  });
}
