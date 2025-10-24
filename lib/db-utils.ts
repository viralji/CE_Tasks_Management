import { Pool, PoolClient } from 'pg';

/**
 * Database utility functions with proper error handling and connection management
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Execute a database query with automatic connection management
 */
export async function executeQuery<T = any>(
  pool: Pool,
  query: string,
  params: any[] = []
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute a database transaction with automatic rollback on error
 */
export async function executeTransaction<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if a record exists in the database
 */
export async function recordExists(
  pool: Pool,
  table: string,
  conditions: Record<string, any>
): Promise<boolean> {
  const whereClause = Object.keys(conditions)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(' AND ');
  
  const values = Object.values(conditions);
  const query = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
  
  const rows = await executeQuery(pool, query, values);
  return rows.length > 0;
}

/**
 * Get a single record by ID
 */
export async function getRecordById<T>(
  pool: Pool,
  table: string,
  id: string,
  columns: string[] = ['*']
): Promise<T | null> {
  const columnList = columns.join(', ');
  const rows = await executeQuery<T>(pool, `SELECT ${columnList} FROM ${table} WHERE id = $1`, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Insert a record and return the created record
 */
export async function insertRecord<T>(
  pool: Pool,
  table: string,
  data: Record<string, any>,
  returningColumns: string[] = ['*']
): Promise<T> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  const columnList = columns.join(', ');
  const returningList = returningColumns.join(', ');
  
  const query = `
    INSERT INTO ${table} (${columnList})
    VALUES (${placeholders})
    RETURNING ${returningList}
  `;
  
  const rows = await executeQuery<T>(pool, query, values);
  return rows[0];
}

/**
 * Update a record by ID and return the updated record
 */
export async function updateRecord<T>(
  pool: Pool,
  table: string,
  id: string,
  data: Record<string, any>,
  returningColumns: string[] = ['*']
): Promise<T> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
  const returningList = returningColumns.join(', ');
  
  const query = `
    UPDATE ${table}
    SET ${setClause}
    WHERE id = $${values.length + 1}
    RETURNING ${returningList}
  `;
  
  const rows = await executeQuery<T>(pool, query, [...values, id]);
  return rows[0];
}

/**
 * Delete a record by ID
 */
export async function deleteRecord(
  pool: Pool,
  table: string,
  id: string
): Promise<boolean> {
  const rows = await executeQuery(
    pool,
    `DELETE FROM ${table} WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows.length > 0;
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(pool: Pool): Promise<boolean> {
  try {
    await executeQuery(pool, 'SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
