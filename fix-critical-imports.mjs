#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixCriticalImports(content, filePath) {
  let changed = false;
  let modifiedContent = content;

  // Fix common import issues that cause runtime errors
  const fixes = [
    // Fix missing .js extensions in imports
    {
      pattern: /from\s+['"]([^'"]+)['"]/g,
      replacement: (match, importPath) => {
        if (!importPath.endsWith('.js') && !importPath.endsWith('.ts') && !importPath.startsWith('.')) {
          return match; // Don't modify external imports
        }
        if (!importPath.endsWith('.js') && !importPath.endsWith('.ts') && importPath.startsWith('.')) {
          // Add .js extension to relative imports
          const newPath = importPath + '.js';
          changed = true;
          return match.replace(importPath, newPath);
        }
        return match;
      }
    },
    
    // Fix specific problematic imports
    {
      pattern: /import\s+.*from\s+['"]\.\.\/eventsbus\/index\.js['"]/g,
      replacement: () => {
        changed = true;
        return `import { applicationEventsBus } from '../eventsbus/index.js'`;
      }
    },
    
    // Fix path imports that might be missing
    {
      pattern: /import\s+.*from\s+['"]path['"]/g,
      replacement: () => {
        changed = true;
        return `import * as path from 'path'`;
      }
    },
    
    // Fix fs imports
    {
      pattern: /import\s+.*from\s+['"]fs\/promises['"]/g,
      replacement: () => {
        changed = true;
        return `import { promises as fs } from 'fs'`;
      }
    }
  ];

  for (const fix of fixes) {
    if (fix.replacement) {
      modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
    }
  }

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing critical import issues...');
  
  // Find all TypeScript files in the api directory
  const files = await glob('app/api/**/*.{ts,js}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has import issues
      const hasIssues = /from\s+['"]\.\.\/eventsbus\/index\.js['"]/.test(content) ||
                       /import\s+.*from\s+['"]path['"]/.test(content) ||
                       /import\s+.*from\s+['"]fs\/promises['"]/.test(content);
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixCriticalImports(content, file);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed imports in ${file}`);
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

