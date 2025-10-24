/**
 * Authentication Helper Utilities
 * 
 * Reusable authentication utilities for consistent auth handling
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

export interface AuthResult {
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  userId?: string;
  orgId?: string;
  organizations?: Array<{ id: string; name: string; role: string }>;
  needsOrgAssignment?: boolean;
}

/**
 * Get authentication status and user context
 */
export async function getAuthContext(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { isAuthenticated: false, isSuperAdmin: false };
  }

  return {
    isAuthenticated: true,
    isSuperAdmin: (session as any).user?.isSuperAdmin || false,
    userId: (session as any).user?.id,
    orgId: (session as any).org,
    organizations: (session as any).organizations,
    needsOrgAssignment: (session as any).needsOrgAssignment
  };
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(): Promise<AuthResult> {
  const auth = await getAuthContext();
  
  if (!auth.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return auth;
}

/**
 * Check if user is super admin
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const auth = await requireAuth();
  
  if (!auth.isSuperAdmin) {
    throw new Error('Super admin access required');
  }
  
  return auth;
}

/**
 * Get client IP for rate limiting
 */
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
          request.headers.get('x-real-ip') || 
          'unknown';
}

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  data: T, 
  status: number = 200, 
  message?: string
) {
  return {
    success: status < 400,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: string, 
  status: number = 400, 
  details?: any
) {
  return {
    success: false,
    error,
    details,
    timestamp: new Date().toISOString()
  };
}
