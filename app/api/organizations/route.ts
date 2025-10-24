import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';

/**
 * GET /api/organizations
 * 
 * Fetches all organizations for admin user management.
 * Only accessible by authenticated users.
 * 
 * @param request - Next.js request object
 * @returns JSON response with organizations array
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📋 Fetching all organizations...');

    // Query all organizations
    const organizationsResult = await pool.query(`
      SELECT id, name, created_at
      FROM organization
      ORDER BY name ASC
    `);

    const organizations = organizationsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      created_at: row.created_at
    }));

    console.log(`✅ Found ${organizations.length} organizations`);

    return NextResponse.json({
      success: true,
      organizations
    });

  } catch (error) {
    console.error('❌ Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
