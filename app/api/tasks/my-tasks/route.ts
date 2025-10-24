/**
 * My Tasks API Route
 * 
 * Handles fetching all tasks assigned to the current user.
 * Returns tasks with project information in a format suitable
 * for the "My Tasks" tabular view.
 * 
 * @fileoverview API endpoint for user's assigned tasks
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/tasks/my-tasks
 * 
 * Fetches all tasks assigned to the authenticated user.
 * Returns tasks with project information for display in the "My Tasks" view.
 * 
 * @param req - NextRequest object
 * @returns JSON response with user's tasks or error
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session as any).user?.id as string;
  const orgId = (session as any).org as string;
  const isSuperAdmin = (session as any).user?.isSuperAdmin === true;

  try {
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      /**
       * Query to fetch user's assigned tasks
       * 
       * Super admin sees all tasks, regular users see only assigned tasks
       * Joins task, task_assignment, and project tables to get:
       * - Task details (id, title, description, status, priority, dates)
       * - Project information (project_id, project_name)
       * - Filters by user assignment and organization
       * - Excludes soft-deleted tasks
       * - Orders by most recently updated
       */
      let query, params;
      if (isSuperAdmin) {
        query = `
          SELECT 
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.due_at,
            t.created_at,
            t.updated_at,
            t.project_id,
            p.name as project_name
          FROM task t
          JOIN project p ON t.project_id = p.id
          WHERE t.org_id = $1 AND t.deleted_at IS NULL
          ORDER BY t.updated_at DESC
        `;
        params = [orgId];
      } else {
        query = `
          SELECT 
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.due_at,
            t.created_at,
            t.updated_at,
            t.project_id,
            p.name as project_name
          FROM task t
          JOIN task_assignment ta ON t.id = ta.task_id
          JOIN project p ON t.project_id = p.id
          WHERE ta.user_id = $1 AND ta.org_id = $2 AND t.deleted_at IS NULL
          ORDER BY t.updated_at DESC
        `;
        params = [userId, orgId];
      }
      
      const result = await client.query(query, params);

      return NextResponse.json({ data: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
