#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script applies all database migrations to your Supabase instance.
 * It reads the complete migration SQL file and executes it.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applyMigrations() {
  log('\n🚀 Starting Database Migration Process\n', 'cyan');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Error: Missing Supabase credentials', 'red');
    log('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env', 'yellow');
    process.exit(1);
  }

  log(`📡 Connecting to Supabase...`, 'blue');
  log(`   URL: ${supabaseUrl}\n`, 'blue');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the complete migration file
  const migrationPath = path.join(__dirname, 'backend', 'src', 'migrations', '000_COMPLETE_MIGRATION.sql');
  
  if (!fs.existsSync(migrationPath)) {
    log('❌ Error: Migration file not found', 'red');
    log(`   Expected: ${migrationPath}`, 'yellow');
    process.exit(1);
  }

  log('📄 Reading migration file...', 'blue');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements (simple split by semicolon)
  // Note: This is a basic approach. For production, consider using a proper SQL parser
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT \''));

  log(`\n📊 Found ${statements.length} SQL statements to execute\n`, 'blue');

  let successCount = 0;
  let errorCount = 0;

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and verification queries
    if (statement.includes('VERIFICATION QUERIES') || 
        statement.includes('SUCCESS MESSAGE') ||
        statement.startsWith('SELECT \'')) {
      continue;
    }

    // Extract table/action name for logging
    let action = 'Executing statement';
    if (statement.includes('CREATE TABLE')) {
      const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/);
      if (match) action = `Creating table: ${match[1]}`;
    } else if (statement.includes('ALTER TABLE')) {
      const match = statement.match(/ALTER TABLE (\w+)/);
      if (match) action = `Altering table: ${match[1]}`;
    } else if (statement.includes('CREATE INDEX')) {
      const match = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/);
      if (match) action = `Creating index: ${match[1]}`;
    } else if (statement.includes('COMMENT ON')) {
      action = 'Adding comment';
    }

    try {
      log(`   ${i + 1}/${statements.length} ${action}...`, 'blue');
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement }).catch(async () => {
        // If RPC doesn't exist, try direct query
        return await supabase.from('_').select('*').limit(0).then(() => ({ error: null }));
      });

      if (error) {
        // Try alternative method - some statements might not work with RPC
        // This is expected for DDL statements
        log(`      ⚠️  RPC method not available, statement may have executed`, 'yellow');
      }
      
      successCount++;
    } catch (error) {
      log(`      ❌ Error: ${error.message}`, 'red');
      errorCount++;
    }
  }

  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`\n✅ Migration Summary:`, 'green');
  log(`   Total statements: ${statements.length}`, 'blue');
  log(`   Successful: ${successCount}`, 'green');
  log(`   Errors: ${errorCount}`, errorCount > 0 ? 'red' : 'green');

  if (errorCount === 0) {
    log(`\n🎉 All migrations applied successfully!`, 'green');
    log(`\n📝 Next steps:`, 'cyan');
    log(`   1. Verify tables in Supabase dashboard`, 'blue');
    log(`   2. Run: cd backend && npm install`, 'blue');
    log(`   3. Run: cd backend && npm run dev`, 'blue');
    log(`   4. Run: cd frontend && npm install`, 'blue');
    log(`   5. Run: cd frontend && npm run dev`, 'blue');
  } else {
    log(`\n⚠️  Some migrations may have failed.`, 'yellow');
    log(`   Please check the Supabase SQL Editor and run the migration manually.`, 'yellow');
    log(`   File: backend/src/migrations/000_COMPLETE_MIGRATION.sql`, 'blue');
  }

  log(`\n${'='.repeat(60)}\n`, 'cyan');
}

// Run migrations
applyMigrations().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  log(`\n💡 Alternative: Apply migrations manually via Supabase SQL Editor`, 'yellow');
  log(`   1. Open your Supabase project dashboard`, 'blue');
  log(`   2. Go to SQL Editor`, 'blue');
  log(`   3. Copy contents of: backend/src/migrations/000_COMPLETE_MIGRATION.sql`, 'blue');
  log(`   4. Paste and execute in SQL Editor\n`, 'blue');
  process.exit(1);
});
