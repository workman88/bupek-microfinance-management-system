import fs from 'fs';
import path from 'path';
import { getPool } from './connection';
import logger from '../config/logger';

const migrationsDir = path.join(__dirname, '../database');

interface Migration {
  name: string;
  path: string;
}

export const getMigrations = (): Migration[] => {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && /^\d+_/.test(f))
    .sort();

  return files.map(f => ({
    name: f,
    path: path.join(migrationsDir, f),
  }));
};

export const runMigrations = async (): Promise<void> => {
  const pool = getPool();
  const migrations = getMigrations();

  if (migrations.length === 0) {
    logger.warn('[Migrations] No migration files found');
    return;
  }

  try {
    logger.info('[Migrations] Starting database migrations');

    for (const migration of migrations) {
      const sql = fs.readFileSync(migration.path, 'utf-8');
      logger.info(`[Migrations] Running ${migration.name}...`);

      await pool.query(sql);
      logger.info(`[Migrations] ✓ ${migration.name} completed`);
    }

    logger.info('[Migrations] All migrations completed successfully');
  } catch (error: any) {
    logger.error('[Migrations] Migration failed:', error.message);
    throw error;
  }
};

export const seedDatabase = async (): Promise<void> => {
  const pool = getPool();
  const seedFile = path.join(migrationsDir, '002_seed_data.sql');

  if (!fs.existsSync(seedFile)) {
    logger.warn('[Seed] Seed file not found');
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
  runMigrations,
  seedDatabase,
  getMigrations,
};
