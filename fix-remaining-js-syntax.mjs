#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixRemainingJSSyntax(content) {
  let changed = false;
  let modifiedContent = content;

  // Fix incorrect parameter type annotations in event handlers
  // Pattern: .method(param: any => should be .method((param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.(\w+)\((\w+):\s*any\s*=>\s*{/g,
    (match, method, param) => {
      changed = true;
      return `.${method}((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in function calls
  // Pattern: function(param: any => should be function((param: any) =>
  modifiedContent = modifiedContent.replace(
    /(\w+)\((\w+):\s*any\s*=>\s*{/g,
    (match, func, param) => {
      changed = true;
      return `${func}((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in arrow functions
  // Pattern: (param: any => should be (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\(\s*(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `(${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in object methods
  // Pattern: method: param: any => should be method: (param: any) =>
  modifiedContent = modifiedContent.replace(
    /(\w+):\s*(\w+):\s*any\s*=>\s*{/g,
    (match, method, param) => {
      changed = true;
      return `${method}: (${param}: any) => {`;
    }
  );

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing remaining JavaScript syntax errors...');
  
  // Find all JavaScript files
  const files = await glob('**/*.{js,jsx}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has syntax issues
      const hasIssues = /\(\w+:\s*any\s*=>\s*{/.test(content) || 
                       /\.\w+\(\w+:\s*any\s*=>\s*{/.test(content) ||
                       /:\s*\w+:\s*any\s*=>\s*{/.test(content);
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixRemainingJSSyntax(content);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed remaining JS syntax in ${file}`);
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
