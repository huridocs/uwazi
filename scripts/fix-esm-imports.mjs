#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Starting comprehensive ESM import fixes...\n');
console.log('📝 Running unified import fixer (replaces all previous scripts)...\n');

try {
  execSync(`node scripts/fix-esm-imports-unified.mjs`, { 
    cwd: projectRoot, 
    stdio: 'inherit',
    encoding: 'utf-8' 
  });
} catch (error) {
  console.error(`❌ Error:`, error.message);
  process.exit(1);
}

console.log('\n✨ All import fixes completed!');
console.log('\n💡 Next steps:');
console.log('   1. Run "yarn hot" to check for remaining errors');
console.log('   2. Run "yarn check-types" to verify TypeScript');
console.log('   3. Fix any remaining broken imports manually if needed');
