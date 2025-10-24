/**
 * Database Helper Utilities
 * 
 * Optimized database query helpers with caching and connection pooling
 */

import { pool } from '@/lib/db';

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or fetch from database
 */
async function getCachedData<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl: number = CACHE_TTL
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < ttl) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: now });
  
  return data;
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Get user by email with organization context
 */
export async function getUserWithOrganizations(email: string) {
  return getCachedData(
    `user-orgs-${email}`,
    async () => {
      const result = await pool.query(`
        SELECT 
          u.id, u.name, u.primary_email, u.image,
          o.id as org_id, o.name as org_name, om.role
        FROM app_user u
        LEFT JOIN user_organization om ON u.id = om.user_id
        LEFT JOIN organization o ON om.org_id = o.id
        WHERE u.primary_email = $1
      `, [email]);
      
      return result.rows;
    }
  );
}

/**
 * Get all organizations for admin interface
 */
export async function getAllOrganizations() {
  return getCachedData(
    'all-organizations',
    async () => {
      const result = await pool.query(`
        SELECT id, name, created_at
        FROM organization
        ORDER BY name ASC
      `);
      return result.rows;
    }
  );
}

/**
 * Get all users with their organization memberships
 */
export async function getAllUsersWithOrganizations() {
  return getCachedData(
    'all-users-with-orgs',
    async () => {
      const result = await pool.query(`
        SELECT 
          u.id, u.name, u.primary_email, u.image, u.created_at,
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
      return result.rows;
    }
  );
}

/**
 * Assign user to organizations in a transaction
 */
export async function assignUserToOrganizations(
  userId: string, 
  organizationIds: string[], 
  role: string = 'MEMBER'
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Remove existing memberships
    await client.query(
      'DELETE FROM user_organization WHERE user_id = $1',
      [userId]
    );
    
    // Add new memberships
    for (const orgId of organizationIds) {
      await client.query(`
        INSERT INTO user_organization (user_id, org_id, role, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [userId, orgId, role]);
    }
    
    await client.query('COMMIT');
    
    // Clear relevant cache
    clearCache('all-users-with-orgs');
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Remove user from all organizations
 */
export async function removeUserFromAllOrganizations(userId: string) {
  const result = await pool.query(
    'DELETE FROM user_organization WHERE user_id = $1',
    [userId]
  );
  
  // Clear relevant cache
  clearCache('all-users-with-orgs');
  
  return result.rowCount;
}

/**
 * Get user's organization memberships
 */
export async function getUserOrganizations(userId: string) {
  return getCachedData(
    `user-orgs-${userId}`,
    async () => {
      const result = await pool.query(`
        SELECT o.id, o.name, om.role
        FROM user_organization om
        JOIN organization o ON om.org_id = o.id
        WHERE om.user_id = $1
        ORDER BY o.name
      `, [userId]);
      return result.rows;
    }
  );
}

/**
 * Check if user exists by email
 */
export async function userExists(email: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM app_user WHERE primary_email = $1 LIMIT 1',
    [email]
  );
  return result.rows.length > 0;
}

/**
 * Create new user
 */
export async function createUser(userData: {
  name: string;
  email: string;
  image?: string;
}) {
  const result = await pool.query(`
    INSERT INTO app_user (id, name, primary_email, image, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
    RETURNING id, name, primary_email, image, created_at
  `, [userData.name, userData.email, userData.image]);
  
  // Clear cache
  clearCache('all-users-with-orgs');
  
  return result.rows[0];
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  return getCachedData(
    `user-${userId}`,
    async () => {
      const result = await pool.query(
        'SELECT id, name, primary_email, image, created_at FROM app_user WHERE id = $1',
        [userId]
      );
      return result.rows[0];
    }
  );
}
