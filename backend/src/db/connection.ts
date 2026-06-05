import { Pool, QueryResult } from 'pg';
import { databaseConfig } from '../config/database';
import logger from '../config/logger';

let pool: Pool;

/**
 * Initialize database connection pool
 */
export const initializePool = (): Pool => {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    ...databaseConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    logger.error('[Database] Unexpected error on idle client', err);
  });

  logger.info('[Database] Connection pool initialized');
  return pool;
};

/**
 * Get pool instance
 */
export const getPool = (): Pool => {
  if (!pool) {
    return initializePool();
  }
  return pool;
};

/**
 * Execute query
 */
export const query = async (
  text: string,
  params?: any[]
): Promise<QueryResult> => {
  const poolInstance = getPool();
  const start = Date.now();

  try {
    const result = await poolInstance.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`[Database] Query executed in ${duration}ms`, {
      query: text.substring(0, 100),
      paramCount: params?.length || 0,
    });
    return result;
  } catch (error) {
    logger.error('[Database] Query error:', {
      query: text.substring(0, 100),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Check database connection
 */
export const checkConnection = async (): Promise<boolean> => {
  try {
    const poolInstance = getPool();
    const result = await poolInstance.query('SELECT NOW()');
    logger.info('[Database] Connection check successful');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('[Database] Connection check failed:', error);
    return false;
  }
};

/**
 * Close connection pool
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    try {
      await pool.end();
      logger.info('[Database] Connection pool closed');
    } catch (error) {
      logger.error('[Database] Error closing connection pool:', error);
    }
  }
};

export default {
  query,
  checkConnection,
  closePool,
  getPool,
  initializePool,
};