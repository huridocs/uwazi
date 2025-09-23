#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixFinalSyntax(content) {
  let changed = false;
  let modifiedContent = content;

  // Fix incorrect return type annotations
  // Pattern: ): ReturnType: any => should be ): ReturnType =>
  modifiedContent = modifiedContent.replace(
    /\):\s*([^:]+):\s*any\s*=>\s*{/g,
    (match, returnType) => {
      changed = true;
      return `): ${returnType.trim()} => {`;
    }
  );

  // Fix incorrect return type annotations with complex types
  // Pattern: ): { ... } | null: any => should be ): { ... } | null =>
  modifiedContent = modifiedContent.replace(
    /\):\s*(\{[^}]+\}|\w+)\s*\|\s*(\w+):\s*any\s*=>\s*{/g,
    (match, type1, type2) => {
      changed = true;
      return `): ${type1} | ${type2} => {`;
    }
  );

  // Fix incorrect return type annotations with union types
  // Pattern: ): Type1 | Type2: any => should be ): Type1 | Type2 =>
  modifiedContent = modifiedContent.replace(
    /\):\s*([^:]+)\s*\|\s*([^:]+):\s*any\s*=>\s*{/g,
    (match, type1, type2) => {
      changed = true;
      return `): ${type1.trim()} | ${type2.trim()} => {`;
    }
  );

  // Fix incorrect parameter type annotations in function declarations
  // Pattern: function(param: any) => should be function((param: any) =>
  modifiedContent = modifiedContent.replace(
    /(\w+)\((\w+):\s*any\)\s*=>\s*{/g,
    (match, func, param) => {
      changed = true;
      return `${func}((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in arrow functions
  // Pattern: (param: any) => should be (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\(\s*(\w+):\s*any\)\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `(${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in method calls
  // Pattern: .method(param: any) => should be .method((param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.(\w+)\((\w+):\s*any\)\s*=>\s*{/g,
    (match, method, param) => {
      changed = true;
      return `.${method}((${param}: any) => {`;
    }
  );

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing final syntax errors...');
  
  // Find all TypeScript files
  const files = await glob('**/*.{ts,tsx}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has syntax issues
      const hasIssues = /:\s*[^:]+:\s*any\s*=>\s*{/.test(content) || 
                       /\(\w+:\s*any\)\s*=>\s*{/.test(content);
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixFinalSyntax(content);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed final syntax in ${file}`);
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
