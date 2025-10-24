/**
 * Admin Organizations API
 * 
 * @fileoverview API for listing organizations in admin panel
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
import { errorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/admin/organizations
 * List all organizations for admin panel
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const isSuperAdmin = (session as any).user?.isSuperAdmin === true;
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      // Get all organizations with member counts
      const result = await client.query(`
        SELECT 
          o.id,
          o.name,
          o.created_at,
          COUNT(om.user_id) as member_count
        FROM organization o
        LEFT JOIN organization_membership om ON om.org_id = o.id
        GROUP BY o.id, o.name, o.created_at
        ORDER BY o.created_at DESC
      `);

      const organizations = result.rows.map(org => ({
        id: org.id,
        name: org.name,
        created_at: org.created_at,
        member_count: parseInt(org.member_count) || 0
      }));

      return NextResponse.json({
        data: organizations
      });
    } finally {
      client.release();
    }
  } catch (error) {
    errorHandler.handleError(error as Error, { context: 'GET admin organizations' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
