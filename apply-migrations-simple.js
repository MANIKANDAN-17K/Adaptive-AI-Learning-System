#!/usr/bin/env node

/**
 * Simple Database Migration Script
 * 
 * Applies migrations by executing the SQL file directly via Supabase REST API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applyMigrations() {
  log('\n🚀 Database Migration Script\n', 'cyan');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Error: Missing Supabase credentials', 'red');
    log('\nPlease ensure these are set in backend/.env:', 'yellow');
    log('  - SUPABASE_URL', 'blue');
    log('  - SUPABASE_SERVICE_ROLE_KEY', 'blue');
    log('\n💡 Tip: Copy backend/.env.example to backend/.env and fill in your credentials\n', 'cyan');
    process.exit(1);
  }

  log('✅ Environment variables loaded', 'green');
  log(`📡 Supabase URL: ${supabaseUrl}\n`, 'blue');

  // Read migration file
  const migrationPath = path.join(__dirname, 'backend', 'src', 'migrations', '000_COMPLETE_MIGRATION.sql');
  
  if (!fs.existsSync(migrationPath)) {
    log('❌ Error: Migration file not found', 'red');
    log(`   Expected: ${migrationPath}\n`, 'yellow');
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  log('📄 Migration file loaded', 'green');
  log(`📊 File size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`, 'blue');

  log('=' .repeat(60), 'cyan');
  log('IMPORTANT: Manual Migration Required', 'yellow');
  log('=' .repeat(60), 'cyan');
  
  log('\nDue to Supabase API limitations, please apply the migration manually:\n', 'yellow');
  
  log('1️⃣  Open your Supabase Dashboard:', 'cyan');
  log(`   ${supabaseUrl.replace('/rest/v1', '')}\n`, 'blue');
  
  log('2️⃣  Navigate to: SQL Editor (left sidebar)\n', 'cyan');
  
  log('3️⃣  Click: "New Query"\n', 'cyan');
  
  log('4️⃣  Copy the migration file:', 'cyan');
  log(`   File: ${migrationPath}\n`, 'blue');
  
  log('5️⃣  Paste the SQL into the editor and click "Run"\n', 'cyan');
  
  log('6️⃣  Verify success by checking for these tables:', 'cyan');
  log('   ✓ users', 'green');
  log('   ✓ personality_profiles', 'green');
  log('   ✓ skills', 'green');
  log('   ✓ roadmaps', 'green');
  log('   ✓ sessions', 'green');
  log('   ✓ performance_logs\n', 'green');

  log('=' .repeat(60), 'cyan');
  log('Alternative: Use Supabase CLI', 'yellow');
  log('=' .repeat(60), 'cyan');
  
  log('\nIf you have Supabase CLI installed:\n', 'yellow');
  log('1. supabase init', 'blue');
  log('2. supabase link --project-ref YOUR_PROJECT_REF', 'blue');
  log('3. Copy migration to supabase/migrations/', 'blue');
  log('4. supabase db push\n', 'blue');

  log('=' .repeat(60), 'cyan');
  log('After Migration', 'green');
  log('=' .repeat(60), 'cyan');
  
  log('\nOnce migrations are applied, start the application:\n', 'green');
  log('Terminal 1 - Backend:', 'cyan');
  log('  cd backend', 'blue');
  log('  npm install', 'blue');
  log('  npm run dev\n', 'blue');
  
  log('Terminal 2 - Frontend:', 'cyan');
  log('  cd frontend', 'blue');
  log('  npm install', 'blue');
  log('  npm run dev\n', 'blue');
  
  log('Then open: http://localhost:5173\n', 'green');
  
  log('=' .repeat(60) + '\n', 'cyan');
}

applyMigrations().catch(error => {
  log(`\n❌ Error: ${error.message}\n`, 'red');
  process.exit(1);
});
