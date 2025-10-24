import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskDetailClient } from './TaskDetailClient';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_at: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_user_name?: string;
  created_by_user_email?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  created_by_user_name?: string;
  created_by_user_email?: string;
}

interface User {
  id: string;
  name: string;
  primary_email: string;
}

export default async function TaskDetail({ params }: { params: Promise<{ projectId: string; taskId: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="p-3">
        <div className="card text-sm">You are not signed in. <a className="underline" href="/signin">Sign in</a></div>
      </div>
    );
  }

  const { projectId, taskId } = await params;
  const orgId = (session as any).org as string;

  try {
    // Fetch all data server-side
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      // Fetch task
      const taskResult = await client.query(`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_at,
          t.created_at,
          t.updated_at,
          t.created_by,
          au.name as created_by_user_name,
          au.primary_email as created_by_user_email
        FROM task t
        LEFT JOIN app_user au ON t.created_by = au.id
        WHERE t.id = $1 AND t.deleted_at IS NULL
      `, [taskId]);

      if (taskResult.rows.length === 0) {
        return (
          <div className="p-3">
            <div className="mt-3 text-center py-8 text-text-dim">Task not found</div>
          </div>
        );
      }

      const task = taskResult.rows[0];

      // Fetch project
      const projectResult = await client.query(`
        SELECT id, name, slug
        FROM project
        WHERE id = $1 AND org_id = $2
      `, [projectId, orgId]);

      const project = projectResult.rows[0];

      // Fetch comments
      const commentsResult = await client.query(`
        SELECT 
          tc.id,
          tc.content,
          tc.created_at,
          au.name as created_by_user_name,
          au.primary_email as created_by_user_email
        FROM task_comment tc
        LEFT JOIN app_user au ON tc.author_id = au.id
        WHERE tc.task_id = $1 AND tc.org_id = $2
        ORDER BY tc.created_at DESC
      `, [taskId, orgId]);

      const comments = commentsResult.rows;

      // Fetch assigned users
      const assignedUsersResult = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.primary_email
        FROM task_assignment ta
        JOIN app_user u ON ta.user_id = u.id
        WHERE ta.task_id = $1 AND ta.org_id = $2
      `, [taskId, orgId]);

      const assignedUsers = assignedUsersResult.rows;

      // Fetch available users (only project members)
      const availableUsersResult = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.primary_email
        FROM app_user u
        JOIN project_member pm ON u.id = pm.user_id
        WHERE pm.org_id = $1 AND pm.project_id = $2
        ORDER BY u.name ASC
      `, [orgId, projectId]);

      const availableUsers = availableUsersResult.rows;

      // Fetch status history
      const statusHistoryResult = await client.query(`
        SELECT 
          from_status,
          to_status,
          changed_at,
          au.name as changed_by_name
        FROM task_status_log tsl
        LEFT JOIN app_user au ON tsl.changed_by = au.id
        WHERE tsl.task_id = $1 AND tsl.org_id = $2
        ORDER BY tsl.changed_at ASC
      `, [taskId, orgId]);

      const statusHistory = statusHistoryResult.rows;

      return (
        <TaskDetailClient
          task={task}
          project={project}
          comments={comments}
          assignedUsers={assignedUsers}
          availableUsers={availableUsers}
          statusHistory={statusHistory}
          projectId={projectId}
          taskId={taskId}
        />
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching task data:', error);
    return (
      <div className="p-3">
        <div className="mt-3 text-center py-8 text-red-500">Error: Failed to load task details</div>
      </div>
    );
  }
}