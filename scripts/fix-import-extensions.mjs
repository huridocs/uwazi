#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function findActualFile(importPath) {
  if (!importPath.startsWith('#app/') && !importPath.startsWith('#api/') && !importPath.startsWith('#shared/')) {
    return null;
  }

  let baseDir;
  let relativePath;

  if (importPath.startsWith('#app/')) {
    baseDir = path.join(projectRoot, 'app/react');
    relativePath = importPath.slice(5);
  } else if (importPath.startsWith('#api/')) {
    baseDir = path.join(projectRoot, 'app/api');
    relativePath = importPath.slice(5);
  } else if (importPath.startsWith('#shared/')) {
    baseDir = path.join(projectRoot, 'app/shared');
    relativePath = importPath.slice(8);
  }

  const cleanPath = relativePath.replace(/\.(js|ts|tsx|jsx)$/, '');

  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    const fullPath = path.join(baseDir, cleanPath + ext);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return { path: fullPath, extension: ext, baseDir, cleanPath };
    }
  }

  const indexExtensions = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  for (const ext of indexExtensions) {
    const fullPath = path.join(baseDir, cleanPath, ext);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return { path: fullPath, extension: ext, baseDir, cleanPath, isIndex: true };
    }
  }

  return null;
}

function getCorrectImportPath(importPath, fileInfo) {
  if (!fileInfo) {
    return null;
  }

  const prefix = importPath.startsWith('#app/') ? '#app/' : importPath.startsWith('#api/') ? '#api/' : '#shared/';
  const cleanPath = importPath.replace(/^#(app|api|shared)\//, '').replace(/\.(js|ts|tsx|jsx)$/, '');

  if (fileInfo.isIndex) {
    return prefix + cleanPath + '/index' + fileInfo.extension;
  }

  return prefix + cleanPath + fileInfo.extension;
}

function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  newContent = newContent.replace(importRegex, (match, importPath) => {
    if (!importPath.startsWith('#app/') && !importPath.startsWith('#api/') && !importPath.startsWith('#shared/')) {
      return match;
    }

    const fileInfo = findActualFile(importPath);
    if (!fileInfo) {
      return match;
    }

    const correctPath = getCorrectImportPath(importPath, fileInfo);
    if (correctPath && correctPath !== importPath) {
      modified = true;
      return match.replace(importPath, correctPath);
    }

    return match;
  });

  newContent = newContent.replace(requireRegex, (match, importPath) => {
    if (!importPath.startsWith('#app/') && !importPath.startsWith('#api/') && !importPath.startsWith('#shared/')) {
      return match;
    }

    const fileInfo = findActualFile(importPath);
    if (!fileInfo) {
      return match;
    }

    const correctPath = getCorrectImportPath(importPath, fileInfo);
    if (correctPath && correctPath !== importPath) {
      modified = true;
      return match.replace(importPath, correctPath);
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
  console.log('🔍 Finding files with ESM imports to fix extensions...');

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
