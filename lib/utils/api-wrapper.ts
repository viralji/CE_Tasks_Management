/**
 * API Wrapper Utilities
 * 
 * Reusable API wrapper functions for consistent error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireSuperAdmin, getClientIP, createErrorResponse } from './auth-helpers';
import { apiRateLimiter } from './validation';

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  requireSuperAdmin?: boolean;
  rateLimit?: boolean;
  methods?: string[];
}

/**
 * Wrapper for API route handlers with built-in auth, rate limiting, and error handling
 */
export function withApiWrapper(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  return async (request: NextRequest, context: any) => {
    try {
      // Check HTTP method
      if (options.methods && !options.methods.includes(request.method)) {
        return NextResponse.json(
          createErrorResponse(`Method ${request.method} not allowed`, 405),
          { status: 405 }
        );
      }

      // Rate limiting
      if (options.rateLimit !== false) {
        const clientIP = getClientIP(request);
        if (!apiRateLimiter.isAllowed(clientIP)) {
          return NextResponse.json(
            createErrorResponse('Too many requests', 429),
            { status: 429 }
          );
        }
      }

      // Authentication checks
      if (options.requireAuth || options.requireSuperAdmin) {
        const auth = await getAuthContext();
        
        if (!auth.isAuthenticated) {
          return NextResponse.json(
            createErrorResponse('Unauthorized', 401),
            { status: 401 }
          );
        }

        if (options.requireSuperAdmin && !auth.isSuperAdmin) {
          return NextResponse.json(
            createErrorResponse('Forbidden - Super admin access required', 403),
            { status: 403 }
          );
        }

        // Add auth context to request
        (request as any).auth = auth;
      }

      // Call the actual handler
      return await handler(request, context);

    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {
        return NextResponse.json(
          createErrorResponse(error.message, 500),
          { status: 500 }
        );
      }

      return NextResponse.json(
        createErrorResponse('Internal server error', 500),
        { status: 500 }
      );
    }
  };
}

/**
 * Database transaction wrapper
 */
export async function withTransaction<T>(
  operation: (client: any) => Promise<T>
): Promise<T> {
  const { pool } = await import('@/lib/db');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Retry wrapper for database operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}
