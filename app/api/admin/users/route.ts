import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';

/**
 * GET /api/admin/users
 * 
 * Fetches all users with their organization memberships for admin management.
 * Only accessible by super admins.
 * 
 * @param request - Next.js request object
 * @returns JSON response with users array
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    if (!(session as any).user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('📋 Fetching all users for admin...');

    // Query all users with their organization memberships
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.primary_email as email,
        u.image,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', o.id,
              'name', o.name,
              'role', om.role
            )
          ) FILTER (WHERE o.id IS NOT NULL),
          '[]'::json
        ) as organizations
      FROM app_user u
      LEFT JOIN user_organization om ON u.id = om.user_id
      LEFT JOIN organization o ON om.org_id = o.id
      GROUP BY u.id, u.name, u.primary_email, u.image, u.created_at
      ORDER BY u.created_at DESC
    `);

    const users = usersResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      created_at: row.created_at,
      organizations: row.organizations,
      status: row.organizations.length > 0 ? 'active' : 'pending'
    }));

    console.log(`✅ Found ${users.length} users`);

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
