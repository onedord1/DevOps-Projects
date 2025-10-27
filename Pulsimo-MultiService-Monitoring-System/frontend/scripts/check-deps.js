#!/usr/bin/env node

/**
 * Automatic Dependency Checker and Installer
 * 
 * This script runs automatically before 'npm run dev' and 'npm run build'
 * It checks if node_modules exists and installs dependencies if missing.
 * 
 * Why: Prevents errors when node_modules is accidentally deleted
 * How: Uses npm's pre-hooks (predev, prebuild)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const NODE_MODULES_PATH = path.join(__dirname, '..', 'node_modules');
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNodeModules() {
  return fs.existsSync(NODE_MODULES_PATH);
}

function checkPackageJson() {
  return fs.existsSync(PACKAGE_JSON_PATH);
}

function installDependencies() {
  log('\n🔍 Checking dependencies...', 'cyan');
  
  if (!checkPackageJson()) {
    log('❌ package.json not found!', 'red');
    process.exit(1);
  }

  if (checkNodeModules()) {
    log('✅ node_modules exists - dependencies OK!', 'green');
    return;
  }

  log('\n⚠️  node_modules not found!', 'yellow');
  log('📦 Installing dependencies automatically...', 'blue');
  log('    This may take a minute...\n', 'blue');

  try {
    // Use --legacy-peer-deps for compatibility (as we did with recharts)
    execSync('npm install --legacy-peer-deps', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    log('\n✅ Dependencies installed successfully!', 'green');
    log('🚀 Continuing with your command...\n', 'green');
  } catch (error) {
    log('\n❌ Failed to install dependencies!', 'red');
    log(`Error: ${error.message}`, 'red');
    log('\nPlease run manually: npm install --legacy-peer-deps', 'yellow');
    process.exit(1);
  }
}

// Run the check
installDependencies();
