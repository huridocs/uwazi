#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const absolutePathPrefix = projectRoot;

function convertAbsolutePathToESM(importPath, filePath) {
  if (!importPath.startsWith(absolutePathPrefix)) {
    return null;
  }

  const relativePath = path.relative(projectRoot, importPath);
  const normalized = relativePath.replace(/\\/g, '/');

  if (normalized.startsWith('app/react/')) {
    const esmPath = normalized.replace('app/react/', '#app/');
    return esmPath.endsWith('.js') || esmPath.endsWith('.ts') || esmPath.endsWith('.tsx') || esmPath.endsWith('.jsx')
      ? esmPath
      : esmPath + '.js';
  }

  if (normalized.startsWith('app/api/')) {
    const esmPath = normalized.replace('app/api/', '#api/');
    return esmPath.endsWith('.js') || esmPath.endsWith('.ts') || esmPath.endsWith('.tsx') || esmPath.endsWith('.jsx')
      ? esmPath
      : esmPath + '.js';
  }

  if (normalized.startsWith('app/shared/')) {
    const esmPath = normalized.replace('app/shared/', '#shared/');
    return esmPath.endsWith('.js') || esmPath.endsWith('.ts') || esmPath.endsWith('.tsx') || esmPath.endsWith('.jsx')
      ? esmPath
      : esmPath + '.js';
  }

  return null;
}

function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  newContent = newContent.replace(importRegex, (match, importPath) => {
    const converted = convertAbsolutePathToESM(importPath, filePath);
    if (converted) {
      modified = true;
      return match.replace(importPath, converted);
    }
    return match;
  });

  newContent = newContent.replace(requireRegex, (match, importPath) => {
    const converted = convertAbsolutePathToESM(importPath, filePath);
    if (converted) {
      modified = true;
      return match.replace(importPath, converted);
    }
    return match;
  });

  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Finding files with absolute path imports...');

  const patterns = [
    'app/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.{js,jsx,ts,tsx}',
  ];

  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**'],
    });
    files.push(...matches);
  }

  console.log(`📁 Found ${files.length} files to check`);

  let fixedCount = 0;
  for (const file of files) {
    try {
      if (fixImportsInFile(file)) {
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
