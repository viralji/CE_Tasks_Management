/**
 * Project Hierarchy Management
 * 
 * This module provides functions to manage hierarchical project relationships
 * where child projects inherit members from parent projects.
 * 
 * @fileoverview Project hierarchy and membership inheritance
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { withOrg } from '../db';

/**
 * Get all descendant projects of a given project
 * 
 * @param orgId - Organization ID
 * @param projectId - Parent project ID
 * @returns Array of descendant project IDs
 */
export async function getDescendantProjects(orgId: string, projectId: string): Promise<string[]> {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(`
      WITH RECURSIVE project_hierarchy AS (
        -- Base case: direct children
        SELECT id, parent_id, 1 as level
        FROM project 
        WHERE parent_id = $1 AND org_id = $2
        
        UNION ALL
        
        -- Recursive case: children of children
        SELECT p.id, p.parent_id, ph.level + 1
        FROM project p
        JOIN project_hierarchy ph ON p.parent_id = ph.id
        WHERE p.org_id = $2
      )
      SELECT id FROM project_hierarchy
      ORDER BY level, id
    `, [projectId, orgId]);
    
    return rows.map(row => row.id);
  });
}

/**
 * Get all ancestor projects of a given project
 * 
 * @param orgId - Organization ID
 * @param projectId - Child project ID
 * @returns Array of ancestor project IDs
 */
export async function getAncestorProjects(orgId: string, projectId: string): Promise<string[]> {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(`
      WITH RECURSIVE project_hierarchy AS (
        -- Base case: the project itself
        SELECT id, parent_id, 0 as level
        FROM project 
        WHERE id = $1 AND org_id = $2
        
        UNION ALL
        
        -- Recursive case: parents of parents
        SELECT p.id, p.parent_id, ph.level + 1
        FROM project p
        JOIN project_hierarchy ph ON p.id = ph.parent_id
        WHERE p.org_id = $2
      )
      SELECT id FROM project_hierarchy
      WHERE level > 0
      ORDER BY level DESC, id
    `, [projectId, orgId]);
    
    return rows.map(row => row.id);
  });
}

/**
 * Get all members of a project and its ancestors
 * 
 * @param orgId - Organization ID
 * @param projectId - Project ID
 * @returns Array of user IDs with their roles
 */
export async function getInheritedMembers(orgId: string, projectId: string): Promise<Array<{user_id: string, role: string}>> {
  return withOrg(orgId, async (client) => {
    const { rows } = await client.query(`
      WITH RECURSIVE project_hierarchy AS (
        -- Base case: the project itself
        SELECT id, parent_id, 0 as level
        FROM project 
        WHERE id = $1 AND org_id = $2
        
        UNION ALL
        
        -- Recursive case: parents of parents
        SELECT p.id, p.parent_id, ph.level + 1
        FROM project p
        JOIN project_hierarchy ph ON p.id = ph.parent_id
        WHERE p.org_id = $2
      ),
      all_ancestors AS (
        SELECT id FROM project_hierarchy
        ORDER BY level DESC
      )
      SELECT DISTINCT pm.user_id, pm.role
      FROM project_member pm
      JOIN all_ancestors aa ON pm.project_id = aa.id
      WHERE pm.org_id = $2
      ORDER BY pm.role, pm.user_id
    `, [projectId, orgId]);
    
    return rows;
  });
}

/**
 * Add user to a project and all its descendants
 * 
 * @param orgId - Organization ID
 * @param projectId - Project ID
 * @param userId - User ID
 * @param role - Project role
 */
export async function addUserToProjectAndDescendants(
  orgId: string, 
  projectId: string, 
  userId: string, 
  role: string
): Promise<void> {
  return withOrg(orgId, async (client) => {
    // Get all descendant projects
    const descendants = await getDescendantProjects(orgId, projectId);
    
    // Add user to the main project
    await client.query(`
      INSERT INTO project_member (org_id, project_id, user_id, role)
      VALUES ($1, $2, $3, $4::project_role)
      ON CONFLICT (org_id, project_id, user_id) 
      DO UPDATE SET role = $4::project_role
    `, [orgId, projectId, userId, role]);
    
    // Add user to all descendant projects
    for (const descendantId of descendants) {
      await client.query(`
        INSERT INTO project_member (org_id, project_id, user_id, role)
        VALUES ($1, $2, $3, $4::project_role)
        ON CONFLICT (org_id, project_id, user_id) 
        DO UPDATE SET role = $4::project_role
      `, [orgId, descendantId, userId, role]);
    }
  });
}

/**
 * Remove user from a project and all its descendants
 * 
 * @param orgId - Organization ID
 * @param projectId - Project ID
 * @param userId - User ID
 */
export async function removeUserFromProjectAndDescendants(
  orgId: string, 
  projectId: string, 
  userId: string
): Promise<void> {
  return withOrg(orgId, async (client) => {
    // Get all descendant projects
    const descendants = await getDescendantProjects(orgId, projectId);
    
    // Remove user from the main project
    await client.query(`
      DELETE FROM project_member 
      WHERE org_id = $1 AND project_id = $2 AND user_id = $3
    `, [orgId, projectId, userId]);
    
    // Remove user from all descendant projects
    for (const descendantId of descendants) {
      await client.query(`
        DELETE FROM project_member 
        WHERE org_id = $1 AND project_id = $2 AND user_id = $3
      `, [orgId, descendantId, userId]);
    }
  });
}

/**
 * Inherit members from parent project when creating a new project
 * 
 * @param orgId - Organization ID
 * @param newProjectId - New project ID
 * @param parentProjectId - Parent project ID (optional)
 */
export async function inheritMembersFromParent(
  orgId: string, 
  newProjectId: string, 
  parentProjectId?: string
): Promise<void> {
  if (!parentProjectId) return;
  
  return withOrg(orgId, async (client) => {
    // Get all members from parent project
    const parentMembers = await client.query(`
      SELECT user_id, role FROM project_member 
      WHERE org_id = $1 AND project_id = $2
    `, [orgId, parentProjectId]);
    
    // Add each member to the new project
    for (const member of parentMembers.rows) {
      await client.query(`
        INSERT INTO project_member (org_id, project_id, user_id, role)
        VALUES ($1, $2, $3, $4::project_role)
        ON CONFLICT (org_id, project_id, user_id) DO NOTHING
      `, [orgId, newProjectId, member.user_id, member.role]);
    }
  });
}
