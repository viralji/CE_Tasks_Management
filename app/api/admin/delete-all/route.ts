import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is super admin
  if (!session || !(session as any).user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized - Super admin access required' }, { status: 403 });
  }

  try {
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Delete in correct order to handle foreign key constraints
      await client.query('DELETE FROM task_comment WHERE org_id = $1', [(session as any).org]);
      await client.query('DELETE FROM task_attachment WHERE org_id = $1', [(session as any).org]);
      await client.query('DELETE FROM task_status_log WHERE org_id = $1', [(session as any).org]);
      await client.query('DELETE FROM task_assignment WHERE org_id = $1', [(session as any).org]);
      await client.query('DELETE FROM task_watcher WHERE org_id = $1', [(session as any).org]);
      await client.query('DELETE FROM task WHERE org_id = $1', [(session as any).org]);
      
      await client.query('DELETE FROM project_member WHERE org_id = $1', [(session as any).org]);
      await client.query('DELETE FROM project_settings WHERE org_id = $1', [(session as any).org]);
      await client.query('DELETE FROM project_access WHERE org_id = $1', [(session as any).org]);
      await client.query('DELETE FROM project WHERE org_id = $1', [(session as any).org]);
      
      // Delete all users except admin
      await client.query('DELETE FROM organization_membership WHERE user_id != $1', ['00000000-0000-0000-0000-000000000001']);
      await client.query('DELETE FROM app_user WHERE id != $1', ['00000000-0000-0000-0000-000000000001']);

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        message: 'All data deleted successfully. Admin user and organization preserved.' 
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
