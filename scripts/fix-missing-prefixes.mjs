#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const prefixMappings = {
  '#api/mongodb/': '#api/core/infrastructure/mongodb/',
  '#api/infrastructure/': '#api/core/libs/queue/infrastructure/',
  '#api/contracts/': '#api/core/libs/logger/contracts/',
  '#api/LogEntry': '#api/core/libs/logger/infrastructure/LogEntry',
  '#api/LogWriter': '#api/core/libs/logger/infrastructure/LogWriter',
  '#api/LogLevels': '#api/core/libs/logger/infrastructure/LogLevels',
};

function findActualFile(importPath) {
  if (!importPath.startsWith('#api/')) {
    return null;
  }

  let baseDir = path.join(projectRoot, 'app/api');
  let searchPath = importPath.slice(5);

  const cleanPath = searchPath.replace(/\.(js|ts|tsx|jsx)$/, '');

  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    const fullPath = path.join(baseDir, cleanPath + ext);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return { path: fullPath, extension: ext };
    }
  }

  const indexExtensions = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  for (const ext of indexExtensions) {
    const fullPath = path.join(baseDir, cleanPath, ext);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return { path: fullPath, extension: ext, isIndex: true };
    }
  }

  return null;
}

function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  const importRegex = /from\s+['"]([^'"]+)['"]/g;

  newContent = newContent.replace(importRegex, (match, importPath) => {
    if (!importPath.startsWith('#api/')) {
      return match;
    }

    let newImportPath = importPath;
    let changed = false;

    for (const [oldPrefix, newPrefix] of Object.entries(prefixMappings)) {
      if (importPath.startsWith(oldPrefix)) {
        newImportPath = importPath.replace(oldPrefix, newPrefix);
        changed = true;
        break;
      }
    }

    if (!changed) {
      return match;
    }

    const fileInfo = findActualFile(newImportPath);
    if (fileInfo) {
      const cleanPath = newImportPath.replace(/\.(js|ts|tsx|jsx)$/, '');
      const finalPath = fileInfo.isIndex
        ? cleanPath + '/index' + fileInfo.extension
        : cleanPath + fileInfo.extension;
      
      if (finalPath !== importPath) {
        modified = true;
        return match.replace(importPath, finalPath);
      }
    } else {
      const cleanPath = newImportPath.replace(/\.(js|ts|tsx|jsx)$/, '');
      if (!importPath.endsWith('.js') && !importPath.endsWith('.ts') && !importPath.endsWith('.tsx') && !importPath.endsWith('.jsx')) {
        modified = true;
        return match.replace(importPath, cleanPath + '.ts');
      }
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
  console.log('🔍 Finding files with missing import prefixes...');

  const patterns = [
    'app/**/*.{js,jsx,ts,tsx}',
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
