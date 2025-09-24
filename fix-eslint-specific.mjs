#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixESLintErrors(content, filePath) {
  let changed = false;
  let modifiedContent = content;

  // Fix 1: Remove incorrect eslint-disable-next-line comments
  if (modifiedContent.includes('eslint-disable-next-line { promises as fs } from \'fs\';')) {
    modifiedContent = modifiedContent.replace(
      /\/\/\s*eslint-disable-next-line\s*{\s*promises as fs\s*}\s*from\s*['"]fs['"];\s*/g,
      ''
    );
    changed = true;
  }

  // Fix 2: Add proper fs imports where needed
  if (modifiedContent.includes('fs.') || modifiedContent.includes('fsPromises') || modifiedContent.includes('unlink')) {
    if (!modifiedContent.includes('import') || !modifiedContent.includes('fs')) {
      // Add fs import at the top
      const lines = modifiedContent.split('\n');
      let insertIndex = 0;
      
      // Find the first import or add at the beginning
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, "import { promises as fs } from 'fs';");
      modifiedContent = lines.join('\n');
      changed = true;
    }
  }

  // Fix 3: Remove unused imports
  if (modifiedContent.includes('applicationEventsBus') && modifiedContent.includes('is defined but never used')) {
    modifiedContent = modifiedContent.replace(
      /import\s+{\s*applicationEventsBus\s*}\s+from\s+['"][^'"]+['"];\s*/g,
      ''
    );
    changed = true;
  }

  // Fix 4: Remove duplicate imports
  const importLines = modifiedContent.split('\n').filter(line => line.trim().startsWith('import '));
  const seenImports = new Set();
  const uniqueImports = [];
  
  for (const line of importLines) {
    const match = line.match(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"];/);
    if (match) {
      const [, imports, source] = match;
      const key = `${source}:${imports}`;
      if (!seenImports.has(key)) {
        seenImports.add(key);
        uniqueImports.push(line);
      } else {
        changed = true;
      }
    }
  }

  if (changed && uniqueImports.length > 0) {
    // Replace all import lines with unique ones
    const lines = modifiedContent.split('\n');
    const newLines = lines.filter(line => !line.trim().startsWith('import '));
    newLines.splice(0, 0, ...uniqueImports);
    modifiedContent = newLines.join('\n');
  }

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing specific ESLint errors...');
  
  // Find all TypeScript and JavaScript files
  const files = await glob('app/**/*.{ts,js}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has specific ESLint issues
      const hasIssues = content.includes('eslint-disable-next-line') ||
                       content.includes('fs.') ||
                       content.includes('fsPromises') ||
                       content.includes('applicationEventsBus') ||
                       content.includes('unlink') ||
                       content.includes('is defined but never used');
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixESLintErrors(content, file);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed ESLint errors in ${file}`);
        filesModified++;
        totalReplacements++;
      }
    } catch (error) {
      console.error(`❌ Error processing file ${file}:`, error.message);
    }
  }

  console.log(`\n🎉 Summary:`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total replacements: ${totalReplacements}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

