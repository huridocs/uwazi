#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  console.log('🔍 Finding files with .jsx imports to fix...');

  const patterns = [
    'app/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.{js,jsx,ts,tsx}',
  ];

  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/specs/**', '**/*.spec.*'],
    });
    files.push(...matches);
  }

  console.log(`📁 Found ${files.length} files to check`);

  let fixedCount = 0;
  const importRegex = /from\s+['"]([^'"]*\.jsx)['"]/g;
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]*\.jsx)['"]\s*\)/g;

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8');
      let modified = false;

      content = content.replace(importRegex, (match, importPath) => {
        const newPath = importPath.replace(/\.jsx$/, '.js');
        modified = true;
        return match.replace(importPath, newPath);
      });

      content = content.replace(dynamicImportRegex, (match, importPath) => {
        const newPath = importPath.replace(/\.jsx$/, '.js');
        modified = true;
        return match.replace(importPath, newPath);
      });

      if (modified) {
        writeFileSync(file, content, 'utf-8');
        fixedCount++;
        console.log(`✅ Fixed: ${path.relative(projectRoot, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} files`);
}

main().catch(console.error);
