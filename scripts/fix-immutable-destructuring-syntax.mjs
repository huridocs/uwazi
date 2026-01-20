#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

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

function fixDestructuringSyntax(content) {
  let newContent = content;
  let fixed = false;

  const pattern = /const\s+\{([^}]+)\}\s*=\s*Immutable[^L];?/g;
  const matches = [...content.matchAll(pattern)];

  matches.forEach(match => {
    const destructureContent = match[1];
    if (destructureContent.includes(' as ')) {
      const fixedContent = destructureContent.replace(/\s+as\s+/g, ': ');
      const fullMatch = match[0];
      const fixedMatch = fullMatch.replace(destructureContent, fixedContent);
      newContent = newContent.replace(fullMatch, fixedMatch);
      fixed = true;
    }
  });

  return { content: newContent, fixed };
}

const appDir = join(process.cwd(), 'app');
const files = findFiles(appDir);
const fixedFiles = [];

console.log(`🔍 Scanning ${files.length} files for incorrect destructuring syntax...\n`);

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8');
    if (content.includes(' as ') && content.includes('= Immutable')) {
      const { content: newContent, fixed } = fixDestructuringSyntax(content);
      if (fixed) {
        writeFileSync(file, newContent, 'utf-8');
        fixedFiles.push(file);
      }
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
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
