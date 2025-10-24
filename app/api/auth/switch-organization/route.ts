import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/auth/switch-organization
 * 
 * Switches the user's active organization in their session.
 * Validates that the user has access to the requested organization.
 * 
 * @param request - Next.js request object
 * @returns JSON response with success status
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const userOrganizations = (session as any)?.organizations || [];
    const hasAccess = userOrganizations.some((org: any) => org.id === organizationId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    console.log(`📋 User ${session.user?.email} switching to organization ${organizationId}`);

    // The actual organization switching is handled by the session update
    // in the client-side component. This endpoint is for validation.
    
    return NextResponse.json({
      success: true,
      message: 'Organization switch validated',
      organizationId
    });

  } catch (error) {
    console.error('❌ Error switching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
