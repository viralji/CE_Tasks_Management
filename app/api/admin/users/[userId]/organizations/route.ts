import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
import { orgAssignmentSchema, validateUUID, apiRateLimiter } from '@/lib/utils/validation';

/**
 * POST /api/admin/users/[userId]/organizations
 * 
 * Assigns a user to one or more organizations.
 * Only accessible by super admins.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing userId
 * @returns JSON response with success status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!apiRateLimiter.isAllowed(clientIP)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    if (!(session as any).user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    
    // Validate user ID
    const userIdValidation = validateUUID(userId);
    if (!userIdValidation.isValid) {
      return NextResponse.json({ error: userIdValidation.error }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = orgAssignmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { organizationIds, role } = validation.data;

    console.log(`📋 Assigning user ${userId} to organizations:`, organizationIds);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Remove existing organization memberships
      await client.query(
        'DELETE FROM organization_membership WHERE user_id = $1',
        [userId]
      );

      // Add new organization memberships
      for (const orgId of organizationIds) {
        await client.query(`
          INSERT INTO organization_membership (org_id, user_id, role)
          VALUES ($1, $2, $3::membership_role)
          ON CONFLICT (org_id, user_id) DO UPDATE SET role = $3::membership_role
        `, [orgId, userId, role]);
      }

      await client.query('COMMIT');
      console.log(`✅ User ${userId} assigned to ${organizationIds.length} organizations`);

      return NextResponse.json({
        success: true,
        message: 'User organizations updated successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error updating user organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]/organizations
 * 
 * Removes a user from all organizations.
 * Only accessible by super admins.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing userId
 * @returns JSON response with success status
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params;

    console.log(`📋 Removing user ${userId} from all organizations`);

    // Remove all organization memberships
    const result = await pool.query(
      'DELETE FROM organization_membership WHERE user_id = $1',
      [userId]
    );

    console.log(`✅ Removed ${result.rowCount} organization memberships for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'User removed from all organizations'
    });

  } catch (error) {
    console.error('❌ Error removing user from organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
