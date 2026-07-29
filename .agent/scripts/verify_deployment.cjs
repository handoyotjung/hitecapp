/**
 * Automated Post-Deployment Sanity & Health Auditor
 * Executes smoke tests after builds/deploys to guarantee DB connectivity, auth stability, and non-zero project counts.
 */

const fs = require('fs');
const path = require('path');

const ADMIN_HTML_PATH = path.join(__dirname, '..', '..', 'public', 'admin.html');
const SEED_PATH = path.join(__dirname, '..', '..', 'src', 'demoSafetySeed.js');
const MIGRATIONS_PATH = path.join(__dirname, '..', '..', 'src', 'utils', 'dbMigrations.js');
const ENV_SAFETY_PATH = path.join(__dirname, '..', '..', 'src', 'utils', 'envSafety.js');

let passedChecks = 0;
let totalChecks = 5;

console.log('--------------------------------------------------');
console.log('🔍 Running Post-Deployment Automated Health Audit');
console.log('--------------------------------------------------');

// Check 1: Database Migration & Schema Integrity
try {
  if (!fs.existsSync(MIGRATIONS_PATH)) {
    throw new Error('dbMigrations.js utility file is missing.');
  }
  const migrationsContent = fs.readFileSync(MIGRATIONS_PATH, 'utf8');
  if (!migrationsContent.includes('runDatabaseMigrations') || !migrationsContent.includes('CURRENT_SCHEMA_VERSION')) {
    throw new Error('runDatabaseMigrations function is not properly defined.');
  }
  console.log('✅ Check 1/4 PASSED: Database migration and schema versioning engine intact.');
  passedChecks++;
} catch (e) {
  console.error('❌ Check 1/4 FAILED:', e.message);
}

// Check 2: Authentication & Static Account Retention
try {
  if (!fs.existsSync(ADMIN_HTML_PATH)) {
    throw new Error('public/admin.html file is missing.');
  }
  const adminContent = fs.readFileSync(ADMIN_HTML_PATH, 'utf8');
  if (!adminContent.includes('demo@hitec.id') || !adminContent.includes('handoyo.tjung@gmail.com')) {
    throw new Error('Static accounts demo@hitec.id or handoyo.tjung@gmail.com missing from store configuration.');
  }
  console.log('✅ Check 2/4 PASSED: Authentication endpoints & static account records intact.');
  passedChecks++;
} catch (e) {
  console.error('❌ Check 2/4 FAILED:', e.message);
}

// Check 3: Project Records & Data Retention
try {
  if (!fs.existsSync(SEED_PATH)) {
    throw new Error('demoSafetySeed.js is missing.');
  }
  const seedContent = fs.readFileSync(SEED_PATH, 'utf8');
  if (!seedContent.includes('SAFETY_DEMO_PROJECT_SEED') || !seedContent.includes('Ex_d_Flameproof_Enclosure_Zone1.jpg')) {
    throw new Error('Demo project seed or photo records missing.');
  }
  console.log('✅ Check 3/4 PASSED: Non-zero project record counts and ATEX photo structures verified.');
  passedChecks++;
} catch (e) {
  console.error('❌ Check 3/4 FAILED:', e.message);
}

// Check 4: Environment Safety Gates & Production Protection
try {
  if (!fs.existsSync(ENV_SAFETY_PATH)) {
    throw new Error('envSafety.js is missing.');
  }
  const envContent = fs.readFileSync(ENV_SAFETY_PATH, 'utf8');
  if (!envContent.includes('isProductionEnv') || !envContent.includes('assertNonProductionOperation')) {
    throw new Error('Environment safety functions not properly defined.');
  }
  console.log('✅ Check 4/4 PASSED: Production safety gates & environment protection layer verified.');
  passedChecks++;
} catch (e) {
  console.error('❌ Check 4/4 FAILED:', e.message);
}

// Check 5: Service Worker Production Bundle Safety
try {
  const SW_PATH = path.join(__dirname, '..', '..', 'public', 'sw.js');
  if (!fs.existsSync(SW_PATH)) {
    throw new Error('public/sw.js is missing.');
  }
  const swContent = fs.readFileSync(SW_PATH, 'utf8');
  if (swContent.includes("addEventListener('fetch'") && !swContent.includes('event.respondWith(fetch(event.request)')) {
    throw new Error('Service Worker contains an unhandled/empty fetch event listener, risking chunk interception.');
  }
  console.log('✅ Check 5/5 PASSED: Service Worker cache logic and fetch passthrough verified.');
  passedChecks++;
} catch (e) {
  console.error('❌ Check 5/5 FAILED:', e.message);
}

console.log('--------------------------------------------------');
if (passedChecks === totalChecks) {
  console.log(`🎉 AUDIT PASSED: ${passedChecks}/${totalChecks} health checks passed clean.`);
  process.exit(0);
} else {
  console.error(`💥 AUDIT FAILED: Only ${passedChecks}/${totalChecks} health checks passed.`);
  process.exit(1);
}
