import { NextResponse } from 'next/server';

/**
 * Comprehensive error handling utilities for API routes
 */

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: any;
}

export class AppError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Common error types
 */
export const ErrorTypes = {
  UNAUTHORIZED: { message: 'Unauthorized', status: 401, code: 'UNAUTHORIZED' },
  FORBIDDEN: { message: 'Forbidden', status: 403, code: 'FORBIDDEN' },
  NOT_FOUND: { message: 'Not found', status: 404, code: 'NOT_FOUND' },
  VALIDATION_ERROR: { message: 'Validation error', status: 400, code: 'VALIDATION_ERROR' },
  CONFLICT: { message: 'Conflict', status: 409, code: 'CONFLICT' },
  INTERNAL_ERROR: { message: 'Internal server error', status: 500, code: 'INTERNAL_ERROR' },
} as const;

/**
 * Create a standardized API error response
 */
export function createErrorResponse(error: ApiError | Error | unknown): NextResponse {
  let apiError: ApiError;

  if (error instanceof AppError) {
    apiError = {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    };
  } else if (error instanceof Error) {
    apiError = {
      message: error.message,
      status: 500,
      code: 'INTERNAL_ERROR',
    };
  } else {
    apiError = {
      message: 'An unexpected error occurred',
      status: 500,
      code: 'INTERNAL_ERROR',
    };
  }

  // Don't expose internal details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const response: any = {
    error: apiError.message,
    code: apiError.code,
  };

  if (isDevelopment && apiError.details) {
    response.details = apiError.details;
  }

  return NextResponse.json(response, { status: apiError.status });
}

/**
 * Handle common database errors
 */
export function handleDatabaseError(error: any): AppError {
  if (error.code === '23505') {
    // Unique constraint violation
    return new AppError(
      'A record with this information already exists',
      409,
      'DUPLICATE_ENTRY'
    );
  }

  if (error.code === '23503') {
    // Foreign key constraint violation
    return new AppError(
      'Cannot delete or update record due to existing references',
      409,
      'FOREIGN_KEY_CONSTRAINT'
    );
  }

  if (error.code === '23502') {
    // Not null constraint violation
    return new AppError(
      'Required field is missing',
      400,
      'MISSING_REQUIRED_FIELD'
    );
  }

  if (error.code === '42P01') {
    // Table doesn't exist
    return new AppError(
      'Database table not found',
      500,
      'DATABASE_ERROR'
    );
  }

  // Generic database error
  return new AppError(
    'Database operation failed',
    500,
    'DATABASE_ERROR',
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new AppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
      'VALIDATION_ERROR',
      { missingFields }
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: any): void {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
