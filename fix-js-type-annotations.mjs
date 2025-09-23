#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixJSTypeAnnotations(content) {
  let changed = false;
  let modifiedContent = content;

  // Remove type annotations from JavaScript files
  // Pattern: (param: any) => should be (param) =>
  modifiedContent = modifiedContent.replace(
    /\(\s*(\w+):\s*any\s*\)\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `(${param}) => {`;
    }
  );

  // Remove type annotations from function declarations in JS
  // Pattern: const func = (param: any) => should be const func = (param) =>
  modifiedContent = modifiedContent.replace(
    /const\s+(\w+)\s*=\s*\(\s*(\w+):\s*any\s*\)\s*=>\s*{/g,
    (match, func, param) => {
      changed = true;
      return `const ${func} = (${param}) => {`;
    }
  );

  // Remove type annotations from arrow function assignments in JS
  // Pattern: = (param: any) => should be = (param) =>
  modifiedContent = modifiedContent.replace(
    /=\s*\(\s*(\w+):\s*any\s*\)\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `= (${param}) => {`;
    }
  );

  // Remove type annotations from method calls in JS
  // Pattern: .method((param: any) => should be .method((param) =>
  modifiedContent = modifiedContent.replace(
    /\.(\w+)\(\s*\(\s*(\w+):\s*any\s*\)\s*=>\s*{/g,
    (match, method, param) => {
      changed = true;
      return `.${method}((${param}) => {`;
    }
  );

  // Remove type annotations from function calls in JS
  // Pattern: function((param: any) => should be function((param) =>
  modifiedContent = modifiedContent.replace(
    /(\w+)\(\s*\(\s*(\w+):\s*any\s*\)\s*=>\s*{/g,
    (match, func, param) => {
      changed = true;
      return `${func}((${param}) => {`;
    }
  );

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing type annotations in JavaScript files...');
  
  // Find all JavaScript files
  const files = await glob('**/*.{js,jsx}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has type annotations
      const hasIssues = /\(\w+:\s*any\s*\)\s*=>\s*{/.test(content);
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixJSTypeAnnotations(content);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed type annotations in ${file}`);
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
