#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const replacements = [
  {
    from: /from\s+(['"])#api\/common\.v2\/database\/getConnectionForCurrentTenant(\.js)?(['"])/g,
    to: `from $1#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js$3`,
  },
  {
    from: /import\s+.*from\s+(['"])#api\/common\.v2\/database\/getConnectionForCurrentTenant(\.js)?(['"])/g,
    to: `import $1#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js$3`,
  },
];

async function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let newContent = content;
  let modified = false;

  for (const { from, to } of replacements) {
    const result = newContent.replace(from, to);
    if (result !== newContent) {
      modified = true;
      newContent = result;
    }
  }

  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Finding files with broken imports...\n');

  const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**'],
  });

  let fixedCount = 0;

  for (const file of files) {
    try {
      if (await fixFile(file)) {
        fixedCount++;
        console.log(`✅ Fixed: ${path.relative(projectRoot, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error in ${path.relative(projectRoot, file)}: ${error.message}`);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} files`);
}

main().catch(console.error);
