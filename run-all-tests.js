#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * Runs all tests for both backend and frontend and provides a summary.
 */

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
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

function runCommand(command, cwd, label) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${colors.bold}${label}${colors.reset}`, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');
  
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error };
  }
}

async function runAllTests() {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${colors.bold}🧪 COMPREHENSIVE TEST SUITE${colors.reset}`, 'cyan');
  log(`${colors.bold}Adaptive AI Skill Mentor${colors.reset}`, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');

  const results = {
    backend: null,
    frontend: null
  };

  // Run backend tests
  log('📦 Installing backend dependencies...', 'blue');
  const backendInstall = runCommand(
    'npm install',
    path.join(__dirname, 'backend'),
    '📦 Backend Dependencies'
  );

  if (backendInstall.success) {
    log('\n✅ Backend dependencies installed', 'green');
    
    log('\n🧪 Running backend tests...', 'blue');
    results.backend = runCommand(
      'npm test',
      path.join(__dirname, 'backend'),
      '🧪 Backend Tests'
    );
  } else {
    log('\n❌ Failed to install backend dependencies', 'red');
    results.backend = { success: false };
  }

  // Run frontend tests
  log('\n📦 Installing frontend dependencies...', 'blue');
  const frontendInstall = runCommand(
    'npm install',
    path.join(__dirname, 'frontend'),
    '📦 Frontend Dependencies'
  );

  if (frontendInstall.success) {
    log('\n✅ Frontend dependencies installed', 'green');
    
    log('\n🧪 Running frontend tests...', 'blue');
    results.frontend = runCommand(
      'npm test',
      path.join(__dirname, 'frontend'),
      '🧪 Frontend Tests'
    );
  } else {
    log('\n❌ Failed to install frontend dependencies', 'red');
    results.frontend = { success: false };
  }

  // Print summary
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${colors.bold}📊 TEST SUMMARY${colors.reset}`, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');

  log(`Backend Tests:  ${results.backend?.success ? '✅ PASSED' : '❌ FAILED'}`, 
      results.backend?.success ? 'green' : 'red');
  log(`Frontend Tests: ${results.frontend?.success ? '✅ PASSED' : '❌ FAILED'}`,
      results.frontend?.success ? 'green' : 'red');

  const allPassed = results.backend?.success && results.frontend?.success;

  if (allPassed) {
    log(`\n🎉 All tests passed! Application is production-ready.`, 'green');
    log(`\n📝 Next steps:`, 'cyan');
    log(`   1. Apply database migrations: node apply-migrations.js`, 'blue');
    log(`   2. Start backend: cd backend && npm run dev`, 'blue');
    log(`   3. Start frontend: cd frontend && npm run dev`, 'blue');
    log(`   4. Open http://localhost:5173 in your browser`, 'blue');
  } else {
    log(`\n⚠️  Some tests failed. Please review the output above.`, 'yellow');
    log(`\n💡 Common issues:`, 'cyan');
    log(`   - Missing environment variables in backend/.env`, 'blue');
    log(`   - Database not set up (run: node apply-migrations.js)`, 'blue');
    log(`   - Dependencies not installed`, 'blue');
  }

  log(`\n${'='.repeat(60)}\n`, 'cyan');

  process.exit(allPassed ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  process.exit(1);
});
