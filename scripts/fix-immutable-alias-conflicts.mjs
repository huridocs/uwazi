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

function fixAliasConflicts(content) {
  let newContent = content;
  let fixed = false;

  const conflictPattern = /import\s+Immutable\s+from\s+['"]immutable['"];?\s*\n\s*const\s+{\s*fromJS\s+as\s+Immutable\s*}\s*=\s*Immutable;/g;
  
  if (conflictPattern.test(content)) {
    newContent = newContent.replace(
      /import\s+Immutable\s+from\s+['"]immutable['"];?\s*\n\s*const\s+{\s*fromJS\s+as\s+Immutable\s*}\s*=\s*Immutable;/g,
      `import ImmutableLib from 'immutable';\n\nconst { fromJS: Immutable } = ImmutableLib;`
    );
    fixed = true;
  }

  const conflictPattern2 = /import\s+Immutable\s+from\s+['"]immutable['"];?\s*\n\s*const\s+{\s*([^}]+),\s*fromJS\s+as\s+Immutable\s*}\s*=\s*Immutable;/g;
  
  if (conflictPattern2.test(content)) {
    newContent = newContent.replace(
      /import\s+Immutable\s+from\s+['"]immutable['"];?\s*\n\s*const\s+{\s*([^}]+),\s*fromJS\s+as\s+Immutable\s*}\s*=\s*Immutable;/g,
      (match, otherImports) => {
        return `import ImmutableLib from 'immutable';\n\nconst { ${otherImports}, fromJS: Immutable } = ImmutableLib;`;
      }
    );
    fixed = true;
  }

  return { content: newContent, fixed };
}

const appDir = join(process.cwd(), 'app');
const files = findFiles(appDir);
const fixedFiles = [];

console.log(`🔍 Scanning ${files.length} files for immutable alias conflicts...\n`);

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8');
    if (content.includes("fromJS as Immutable") && content.includes("import Immutable from 'immutable'")) {
      const { content: newContent, fixed } = fixAliasConflicts(content);
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
