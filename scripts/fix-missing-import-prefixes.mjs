#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const importMapAliases = ['V2', 'api', 'shared', 'app', 'UI'];

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...findFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let newContent = content;
  let fixed = false;

  importMapAliases.forEach(alias => {
    const pattern = new RegExp(`(['"])${alias}/`, 'g');
    const matches = [...content.matchAll(pattern)];
    
    if (matches.length > 0) {
      newContent = newContent.replace(pattern, `$1#${alias}/`);
      fixed = true;
    }
  });

  if (fixed) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

const appDir = join(process.cwd(), 'app');
const files = findFiles(appDir);
const fixedFiles = [];

console.log(`🔍 Scanning ${files.length} files for missing import map prefixes...\n`);

files.forEach(file => {
  if (fixFile(file)) {
    fixedFiles.push(file);
  }
});

if (fixedFiles.length === 0) {
  console.log('✅ No files needed fixing!');
  process.exit(0);
}

console.log(`✅ Fixed ${fixedFiles.length} files:\n`);
fixedFiles.forEach(file => {
  const relativePath = file.replace(process.cwd() + '/', '');
  console.log(`  ✓ ${relativePath}`);
});

console.log(`\n📊 Summary: Fixed ${fixedFiles.length} files`);
process.exit(0);
