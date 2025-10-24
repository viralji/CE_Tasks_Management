import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    console.log('🔧 PATCH /api/tasks/[taskId] called');
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const orgId = (session as any).org as string;
    const body = await req.json();
    const { status, priority } = body;
    
    console.log('🔧 Task update request:', { taskId, orgId, status, priority });

    const { pool } = await import('@/lib/db');
    const client = await pool.connect();

    try {
      // Get previous status before update (for logging)
      let previousStatus = null;
      if (status !== undefined) {
        const previousStatusResult = await client.query(`
          SELECT status FROM task WHERE id = $1 AND org_id = $2
        `, [taskId, orgId]);
        
        if (previousStatusResult.rows.length > 0) {
          previousStatus = previousStatusResult.rows[0].status;
        }
      }

      // Update task status and/or priority
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (status !== undefined) {
        updateFields.push(`status = $${paramCount}`);
        updateValues.push(status);
        paramCount++;
      }

      if (priority !== undefined) {
        updateFields.push(`priority = $${paramCount}`);
        updateValues.push(priority);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      // Add updated_at (no parameter needed)
      updateFields.push(`updated_at = NOW()`);
      
      // Add org_id and task_id to the WHERE clause
      updateValues.push(orgId, taskId);

      const query = `
        UPDATE task 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1} AND org_id = $${paramCount}
        RETURNING id, status, priority, updated_at
      `;

      console.log('🔧 Task update query:', query);
      console.log('🔧 Task update values:', updateValues);

      const result = await client.query(query, updateValues);
      
      console.log('🔧 Query result:', { rowCount: result.rows.length, rows: result.rows });

      if (result.rows.length === 0) {
        console.log('❌ Task not found in database');
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      // Log status changes to task_status_log
      if (status !== undefined && previousStatus !== null) {
        const userId = (session as any).user?.id;
        const currentStatus = result.rows[0].status;
        
        // Only log if status actually changed
        if (previousStatus !== currentStatus) {
          await client.query(`
            INSERT INTO task_status_log (org_id, task_id, from_status, to_status, changed_by, changed_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [orgId, taskId, previousStatus, currentStatus, userId]);
          
          console.log('📝 Status change logged:', { from: previousStatus, to: currentStatus });
        }
      }

      console.log('✅ Task updated successfully');
      return NextResponse.json({ 
        data: result.rows[0],
        message: 'Task updated successfully' 
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    console.log('🗑️ DELETE /api/tasks/[taskId] called');
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const orgId = (session as any).org as string;
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;
    
    console.log('🗑️ Task delete request:', { taskId, orgId, isSuperAdmin });

    // Only super admin can delete tasks
    if (!isSuperAdmin) {
      console.log('❌ Only super admin can delete tasks');
      return NextResponse.json({ error: 'Forbidden: Only super admin can delete tasks' }, { status: 403 });
    }

    const { pool } = await import('@/lib/db');
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Delete in correct order to handle foreign key constraints
      await client.query('DELETE FROM task_comment WHERE org_id = $1 AND task_id = $2', [orgId, taskId]);
      await client.query('DELETE FROM task_attachment WHERE org_id = $1 AND task_id = $2', [orgId, taskId]);
      await client.query('DELETE FROM task_status_log WHERE org_id = $1 AND task_id = $2', [orgId, taskId]);
      await client.query('DELETE FROM task_assignment WHERE org_id = $1 AND task_id = $2', [orgId, taskId]);
      await client.query('DELETE FROM task_watcher WHERE org_id = $1 AND task_id = $2', [orgId, taskId]);
      
      // Finally delete the task itself
      const result = await client.query('DELETE FROM task WHERE org_id = $1 AND id = $2 RETURNING id', [orgId, taskId]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log('❌ Task not found');
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('✅ Task deleted successfully');
      return NextResponse.json({ 
        success: true,
        message: 'Task deleted successfully' 
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}