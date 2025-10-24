import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { withOrg } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const orgId = (session as any).org as string;
  const userId = (session as any).user?.id as string;
  const isSuperAdmin = (session as any).user?.isSuperAdmin === true;
  
  if (!orgId) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
  
  try {
    const analytics = await withOrg(orgId, async (client) => {
      // 1. Task counts by status
      const taskCountsResult = await client.query(`
        SELECT status, COUNT(*) as count
        FROM task 
        WHERE org_id = $1 AND deleted_at IS NULL 
        GROUP BY status
      `, [orgId]);
      
      const taskCounts = taskCountsResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>);
      
      // 2. Users with max open tasks
      const usersWithTasksResult = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.primary_email as email,
          COUNT(t.id) as open_tasks
        FROM app_user u
        JOIN user_organization om ON om.user_id = u.id
        LEFT JOIN task_assignment ta ON ta.user_id = u.id
        LEFT JOIN task t ON t.id = ta.task_id AND t.status IN ('OPEN', 'IN_PROGRESS', 'BLOCKED') AND t.deleted_at IS NULL
        WHERE om.org_id = $1
        GROUP BY u.id, u.name, u.primary_email
        ORDER BY open_tasks DESC
        LIMIT 5
      `, [orgId]);
      
      // 3. Top 5 projects by task count (all projects, not just root)
      const topProjectsResult = await client.query(`
        SELECT p.id, p.name, COUNT(t.id) as task_count 
        FROM project p 
        LEFT JOIN task t ON p.id = t.project_id AND t.deleted_at IS NULL
        WHERE p.org_id = $1
        GROUP BY p.id, p.name 
        ORDER BY task_count DESC 
        LIMIT 5
      `, [orgId]);
      
      console.log('Top projects query result:', topProjectsResult.rows);
      
      // 4. Overdue tasks count
      const overdueCountResult = await client.query(`
        SELECT COUNT(*) as count
        FROM task 
        WHERE org_id = $1 AND due_at < NOW() AND status NOT IN ('DONE', 'CANCELED') AND deleted_at IS NULL
      `, [orgId]);
      
      // 5. Average aging of overdue tasks
      const avgAgingResult = await client.query(`
        SELECT AVG(EXTRACT(days FROM NOW() - due_at)) as avg_days
        FROM task 
        WHERE org_id = $1 AND due_at < NOW() AND status NOT IN ('DONE', 'CANCELED') AND deleted_at IS NULL
      `, [orgId]);
      
      // 6. Tasks with max aging (top 10 most overdue)
      const maxAgingResult = await client.query(`
        SELECT t.id, t.title, p.name as project_name, 
               EXTRACT(days FROM NOW() - t.due_at) as days_overdue
        FROM task t
        JOIN project p ON t.project_id = p.id
        WHERE t.org_id = $1 AND t.due_at < NOW() AND t.status NOT IN ('DONE', 'CANCELED') AND t.deleted_at IS NULL
        ORDER BY days_overdue DESC 
        LIMIT 10
      `, [orgId]);
      
      // 7. Super parent projects with open task counts (including all descendant projects)
      const superParentsResult = await client.query(`
        WITH RECURSIVE project_descendants AS (
          -- Base case: root projects
          SELECT id, name, parent_id, id as root_id, name as root_name
          FROM project 
          WHERE org_id = $1 AND parent_id IS NULL
          
          UNION ALL
          
          -- Recursive case: child projects inherit root project info
          SELECT p.id, p.name, p.parent_id, pd.root_id, pd.root_name
          FROM project p
          JOIN project_descendants pd ON p.parent_id = pd.id
        )
        SELECT 
          root_id as id,
          root_name as name,
          COUNT(t.id) as open_tasks
        FROM project_descendants pd
        LEFT JOIN task t ON t.project_id = pd.id AND t.status IN ('OPEN', 'IN_PROGRESS', 'BLOCKED') AND t.deleted_at IS NULL
        GROUP BY root_id, root_name
        ORDER BY open_tasks DESC
      `, [orgId]);
      
      console.log('Super parents query result:', superParentsResult.rows);
      
      // Debug: Check all tasks in the organization
      const allTasksResult = await client.query(`
        SELECT t.id, t.title, t.status, p.name as project_name, p.parent_id
        FROM task t
        JOIN project p ON t.project_id = p.id
        WHERE t.org_id = $1 AND t.deleted_at IS NULL
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [orgId]);
      console.log('All tasks in org:', allTasksResult.rows);
      
      // Debug: Check task statuses
      const taskStatusResult = await client.query(`
        SELECT status, COUNT(*) as count
        FROM task 
        WHERE org_id = $1 AND deleted_at IS NULL
        GROUP BY status
      `, [orgId]);
      console.log('Task status counts:', taskStatusResult.rows);
      
      // Debug: Let's also check if there are any tasks at all
      const totalTasksResult = await client.query(`
        SELECT COUNT(*) as total_tasks
        FROM task 
        WHERE org_id = $1 AND deleted_at IS NULL
      `, [orgId]);
      console.log('Total tasks in org:', totalTasksResult.rows[0]?.total_tasks);
      
      // 8. Completed tasks this week
      const completedThisWeekResult = await client.query(`
        SELECT COUNT(*) as count
        FROM task 
        WHERE org_id = $1 AND status = 'DONE' AND updated_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL
      `, [orgId]);
      
      const analytics = {
        taskCounts,
        usersWithTasks: usersWithTasksResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          openTasks: parseInt(row.open_tasks)
        })),
        topProjects: topProjectsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          taskCount: parseInt(row.task_count)
        })),
        overdueCount: parseInt(overdueCountResult.rows[0]?.count || '0'),
        avgAging: parseFloat(avgAgingResult.rows[0]?.avg_days || '0'),
        maxAging: maxAgingResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          projectName: row.project_name,
          daysOverdue: Math.floor(parseFloat(row.days_overdue))
        })),
        superParents: superParentsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          openTasks: parseInt(row.open_tasks)
        })),
        completedThisWeek: parseInt(completedThisWeekResult.rows[0]?.count || '0')
      };
      
      console.log('Final analytics response:', analytics);
      return analytics;
    });
    
    return NextResponse.json({ data: analytics });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
