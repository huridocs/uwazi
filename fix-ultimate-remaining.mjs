#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixUltimateRemaining(content) {
  let changed = false;
  let modifiedContent = content;

  // Fix incorrect parameter type annotations in event handlers
  // Pattern: .on('event', param: any => should be .on('event', (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.on\(['"][^'"]+['"],\s*(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return match.replace(/(\w+):\s*any\s*=>\s*{/, `(${param}: any) => {`);
    }
  );

  // Fix incorrect parameter type annotations in method calls
  // Pattern: .method(param: any => should be .method((param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.(\w+)\((\w+):\s*any\s*=>\s*{/g,
    (match, method, param) => {
      changed = true;
      return `.${method}((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in async functions
  // Pattern: async param: any => should be async (param: any) =>
  modifiedContent = modifiedContent.replace(
    /async\s+(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `async (${param}: any) => {`;
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

  // Fix incorrect parameter type annotations in function calls
  // Pattern: function(param: any => should be function((param: any) =>
  modifiedContent = modifiedContent.replace(
    /(\w+)\((\w+):\s*any\s*=>\s*{/g,
    (match, func, param) => {
      changed = true;
      return `${func}((${param}: any) => {`;
    }
  );

  // Remove type annotations from JavaScript files
  // Pattern: (param: any) => should be (param) =>
  modifiedContent = modifiedContent.replace(
    /\(\s*(\w+):\s*any\s*\)\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `(${param}) => {`;
    }
  );

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing ultimate remaining syntax errors...');
  
  // Find all TypeScript and JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', { 
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
                       /async\s+\w+:\s*any\s*=>\s*{/.test(content) ||
                       /\(\w+:\s*any\s*\)\s*=>\s*{/.test(content);
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixUltimateRemaining(content);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed ultimate remaining syntax in ${file}`);
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
