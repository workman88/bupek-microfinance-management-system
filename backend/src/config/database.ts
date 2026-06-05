/**
 * Database configuration
 */

import { Pool } from 'pg';
import { databaseConfig } from './database';
import logger from './logger';

let pool: Pool | null = null;

/**
 * Initialize database connection
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    const testPool = new Pool(databaseConfig);
    const result = await testPool.query('SELECT NOW()');
    await testPool.end();
    logger.info('[Database] Connection successful');
    return true;
  } catch (error) {
    logger.error('[Database] Connection failed:', error);
    return false;
  }
};

/**
 * Check connection
 */
export const checkConnection = async (): Promise<boolean> => {
  try {
    const testPool = new Pool(databaseConfig);
    const result = await testPool.query('SELECT NOW()');
    await testPool.end();
    return result.rows.length > 0;
  } catch (error) {
    logger.error('[Database] Connection check failed:', error);
    return false;
  }
};

/**
 * Close pool
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    try {
      await pool.end();
      logger.info('[Database] Connection pool closed');
    } catch (error) {
      logger.error('[Database] Error closing pool:', error);
    }
  }
};

export default {
  initializeDatabase,
  checkConnection,
  closePool,
};
