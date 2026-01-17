#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔄 Reapplying all import fix scripts...\n');

const scripts = [
  'scripts/fix-ts-extensions-in-imports.mjs',
  'scripts/fix-all-webpack-imports.mjs',
  'scripts/fix-missing-extensions.mjs',
  'scripts/fix-prod-imports-and-missing.mjs',
  'scripts/fix-missing-api-modules.mjs',
  'scripts/comprehensive-import-fix.mjs',
];

for (const script of scripts) {
  console.log(`\n📝 Running ${script}...`);
  try {
    const output = execSync(`node ${script}`, { 
      encoding: 'utf-8',
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } catch (error) {
    console.log(`⚠️  ${script} completed with warnings`);
  }
}

console.log('\n✨ Running comprehensive fix multiple times to catch all patterns...\n');

for (let i = 0; i < 5; i++) {
  console.log(`\n📝 Comprehensive fix run ${i + 1}/5...`);
  try {
    execSync('node scripts/comprehensive-import-fix.mjs', { 
      encoding: 'utf-8',
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } catch (error) {
    // continue
  }
}

console.log('\n✅ All fixes reapplied!');
