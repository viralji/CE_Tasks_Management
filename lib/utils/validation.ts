/**
 * Input Validation and Sanitization Utilities
 * 
 * Provides secure input validation and sanitization for user data
 */

import { z } from 'zod';

// UUID validation schema
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Email validation schema
export const emailSchema = z.string().email('Invalid email format').max(255, 'Email too long');

// Organization ID validation
export const orgIdSchema = z.string().uuid('Invalid organization ID');

// User ID validation
export const userIdSchema = z.string().uuid('Invalid user ID');

// Role validation
export const roleSchema = z.enum(['ADMIN', 'MEMBER', 'VIEWER'], {
  errorMap: () => ({ message: 'Invalid role. Must be ADMIN, MEMBER, or VIEWER' })
});

// Organization name validation
export const orgNameSchema = z.string()
  .min(1, 'Organization name is required')
  .max(100, 'Organization name too long')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Organization name contains invalid characters');

// User name validation
export const userNameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Name contains invalid characters');

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email: string): { isValid: boolean; sanitized?: string; error?: string } {
  try {
    const sanitized = sanitizeString(email).toLowerCase();
    emailSchema.parse(sanitized);
    return { isValid: true, sanitized };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid email format' 
    };
  }
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): { isValid: boolean; error?: string } {
  try {
    uuidSchema.parse(uuid);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid UUID format' 
    };
  }
}

/**
 * Validate organization assignment request
 */
export const orgAssignmentSchema = z.object({
  organizationIds: z.array(uuidSchema).min(1, 'At least one organization must be selected'),
  role: roleSchema.optional().default('MEMBER')
});

/**
 * Validate user creation data
 */
export const userCreationSchema = z.object({
  name: userNameSchema,
  email: emailSchema,
  image: z.string().url().optional().or(z.literal(''))
});

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(private maxRequests: number, private windowMs: number) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
}

// Global rate limiter for API endpoints
export const apiRateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes