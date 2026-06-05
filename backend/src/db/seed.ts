/**
 * Database Seed Script
 * Runs seed data migration
 */

import fs from 'fs';
import path from 'path';
import { getPool } from './connection';
import logger from '../config/logger';

const seedFile = path.join(__dirname, '../database/002_seed_data.sql');

export const seedDatabase = async (): Promise<void> => {
  const pool = getPool();

  if (!fs.existsSync(seedFile)) {
    logger.warn('[Seed] Seed file not found at', seedFile);
    return;
  }

  try {
    logger.info('[Seed] Starting database seeding');
    const sql = fs.readFileSync(seedFile, 'utf-8');

    await pool.query(sql);
    logger.info('[Seed] Database seeding completed successfully');
  } catch (error: any) {
    logger.error('[Seed] Seeding failed:', error.message);
    throw error;
  }
};

export default {
  seedDatabase,
};

// Run seed if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('[Seed] Database seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[Seed] Failed to seed database:', error);
      process.exit(1);
    });
}
