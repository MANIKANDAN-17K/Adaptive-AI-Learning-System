/**
 * Migration Runner Utility
 * 
 * This utility helps run SQL migrations against the Supabase database.
 * Note: For production use, consider using Supabase CLI or a proper migration tool.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
// Note: This is a placeholder - actual migrations should be run via Supabase Dashboard or CLI
// @ts-ignore - Variable declared for documentation purposes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Read and execute a SQL migration file
 */
async function runMigration(filename: string): Promise<void> {
  const migrationPath = path.join(__dirname, filename);
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${filename}`);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log(`Running migration: ${filename}`);
  
  // Note: Supabase JS client doesn't support raw SQL execution directly
  // You'll need to use the Supabase SQL Editor or psql for migrations
  // This is a placeholder for documentation purposes
  
  console.warn('Warning: Direct SQL execution via Supabase JS client is not supported.');
  console.warn('Please use one of the following methods:');
  console.warn('1. Supabase Dashboard SQL Editor');
  console.warn('2. Supabase CLI: supabase db push');
  console.warn('3. Direct psql connection');
  console.log('\nSQL to execute:');
  console.log('---');
  console.log(sql);
  console.log('---');
}

/**
 * Run all migrations in order
 */
async function runAllMigrations(): Promise<void> {
  const migrations = [
    '001_create_users_table.sql',
    '002_create_personality_profiles_table.sql',
    '003_create_skills_table.sql',
    '004_create_roadmaps_table.sql',
    '005_create_sessions_table.sql',
    '006_create_performance_logs_table.sql',
  ];

  console.log('Starting database migrations...\n');

  for (const migration of migrations) {
    try {
      await runMigration(migration);
    } catch (error) {
      console.error(`Error running migration ${migration}:`, error);
      process.exit(1);
    }
  }

  console.log('\nAll migrations completed successfully!');
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('\nMigration process finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration, runAllMigrations };
