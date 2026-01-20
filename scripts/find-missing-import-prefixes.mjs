#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
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

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    importMapAliases.forEach(alias => {
      const patterns = [
        new RegExp(`from\\s+['"]${alias}/`, 'g'),
        new RegExp(`import\\s+.*from\\s+['"]${alias}/`, 'g'),
      ];

      patterns.forEach(pattern => {
        if (pattern.test(line) && !line.includes(`#${alias}/`)) {
          const match = line.match(new RegExp(`['"](${alias}/[^'"]+)['"]`));
          if (match) {
            issues.push({
              line: index + 1,
              content: line.trim(),
              suggested: line.replace(
                new RegExp(`['"]${alias}/`, 'g'),
                `'#${alias}/`
              ).trim(),
            });
          }
        }
      });
    });
  });

  return issues;
}

const appDir = join(process.cwd(), 'app');
const files = findFiles(appDir);
const filesWithIssues = [];

console.log(`🔍 Scanning ${files.length} files for missing import map prefixes...\n`);

files.forEach(file => {
  const issues = checkFile(file);
  if (issues.length > 0) {
    filesWithIssues.push({ file, issues });
  }
});

if (filesWithIssues.length === 0) {
  console.log('✅ No files found with missing import map prefixes!');
  process.exit(0);
}

console.log(`❌ Found ${filesWithIssues.length} files with missing import map prefixes:\n`);

filesWithIssues.forEach(({ file, issues }) => {
  const relativePath = file.replace(process.cwd() + '/', '');
  console.log(`📁 ${relativePath}`);
  issues.forEach(({ line, content, suggested }) => {
    console.log(`   Line ${line}:`);
    console.log(`   ❌ ${content}`);
    console.log(`   ✅ ${suggested}`);
    console.log('');
  });
});

console.log(`\n📊 Summary: ${filesWithIssues.length} files need fixing`);
process.exit(1);
