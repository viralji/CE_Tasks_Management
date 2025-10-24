/**
 * Database Connection and Utilities
 * 
 * This module provides database connection pooling and organization-scoped
 * query execution for multi-tenant architecture.
 * 
 * @fileoverview Database connection management with PostgreSQL
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { Pool, PoolClient } from 'pg';

// Database configuration logging
console.log('🔧 Database configuration:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  NODE_ENV: process.env.NODE_ENV
});

/**
 * PostgreSQL connection pool
 * Manages database connections efficiently with automatic connection pooling
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

/**
 * Execute a function with organization context
 * 
 * This utility function ensures all database operations are scoped to a specific
 * organization for multi-tenant data isolation. It sets the organization context
 * in the database session and automatically manages connection lifecycle.
 * 
 * @param orgId - Organization ID to scope the operation
 * @param fn - Function to execute with the database client
 * @returns Promise that resolves to the function result
 * 
 * @example
 * ```typescript
 * const projects = await withOrg(orgId, async (client) => {
 *   const result = await client.query('SELECT * FROM project WHERE org_id = $1', [orgId]);
 *   return result.rows;
 * });
 * ```
 */
export async function withOrg<T>(
  orgId: string | null, 
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    if (orgId) {
      // Set organization context in the database session
      // This ensures all subsequent queries are scoped to the organization
      await client.query('SELECT set_config($1, $2, false)', ['app.current_org', orgId]);
    }
    const result = await fn(client);
    return result;
  } finally {
    // Always release the connection back to the pool
    client.release();
  }
}

/**
 * Get a database client from the pool
 * 
 * Use this for operations that don't require organization scoping
 * or when you need direct access to the database client.
 * 
 * @returns Promise that resolves to a database client
 * 
 * @example
 * ```typescript
 * const client = await pool.connect();
 * try {
 *   const result = await client.query('SELECT * FROM organization');
 *   return result.rows;
 * } finally {
 *   client.release();
 * }
 * ```
 */
export { pool };

/**
 * Database connection health check
 * 
 * Verifies that the database connection is working properly.
 * Useful for health checks and monitoring.
 * 
 * @returns Promise that resolves to true if connection is healthy
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}


