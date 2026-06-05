/**
 * Database Startup Verification Script
 * Verifies database connectivity, runs migrations, and seeds data
 */

import { checkConnection, initializeDatabase } from '../config/database';
import { runMigrations } from './migrations';
import { seedDatabase } from './seed';
import logger from '../config/logger';

export const verifyDatabaseStartup = async (): Promise<boolean> => {
  try {
    logger.info('[Startup] Starting database startup verification...');

    // Step 1: Check connection
    logger.info('[Startup] Step 1: Checking database connection...');
    const connected = await checkConnection();
    
    if (!connected) {
      logger.error('[Startup] Database connection failed');
      return false;
    }
    logger.info('[Startup] ✓ Database connection successful');

    // Step 2: Run migrations
    logger.info('[Startup] Step 2: Running database migrations...');
    try {
      await runMigrations();
      logger.info('[Startup] ✓ Database migrations completed');
    } catch (error) {
      logger.error('[Startup] Migration failed:', error);
      return false;
    }

    // Step 3: Seed database
    logger.info('[Startup] Step 3: Seeding database with initial data...');
    try {
      await seedDatabase();
      logger.info('[Startup] ✓ Database seeding completed');
    } catch (error) {
      logger.warn('[Startup] Database seeding warning:', error);
      // Don't fail on seed errors as it might be already seeded
    }

    logger.info('[Startup] ✓ Database startup verification completed successfully');
    return true;
  } catch (error) {
    logger.error('[Startup] Database startup verification failed:', error);
    return false;
  }
};

export default {
  verifyDatabaseStartup,
};

// Run verification if executed directly
if (require.main === module) {
  verifyDatabaseStartup()
    .then((success) => {
      if (success) {
        logger.info('[Startup] Database verification passed');
        process.exit(0);
      } else {
        logger.error('[Startup] Database verification failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('[Startup] Unexpected error during verification:', error);
      process.exit(1);
    });
}
