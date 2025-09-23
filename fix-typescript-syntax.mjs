#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixTypeScriptSyntax(content) {
  let changed = false;
  let modifiedContent = content;

  // Fix incorrect type annotations that were added in wrong places
  // Pattern: ): ReturnType: any => { should be ): ReturnType => {
  modifiedContent = modifiedContent.replace(
    /\):\s*(\w+):\s*any\s*=>\s*{/g,
    (match, returnType) => {
      changed = true;
      return `): ${returnType} => {`;
    }
  );

  // Fix incorrect parameter type annotations
  // Pattern: (param: any => should be (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\(\s*(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `(${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in forEach
  // Pattern: forEach(param: any => should be forEach((param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.forEach\((\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.forEach((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in map
  // Pattern: .map(param: any => should be .map((param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.map\((\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.map((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in filter
  // Pattern: .filter(param: any => should be .filter((param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.filter\((\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.filter((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in reduce
  // Pattern: .reduce(param: any => should be .reduce((param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.reduce\((\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.reduce((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in catch blocks
  // Pattern: .catch(error: any => should be .catch((error: any) =>
  modifiedContent = modifiedContent.replace(
    /\.catch\((\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.catch((${param}: any) => {`;
    }
  );

  // Fix incorrect parameter type annotations in then blocks
  // Pattern: .then(param: any => should be .then((param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.then\((\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.then((${param}: any) => {`;
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

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing TypeScript syntax errors...');
  
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
      const hasIssues = /:\s*any\s*=>\s*{/.test(content) || 
                       /\(\w+:\s*any\s*=>\s*{/.test(content) ||
                       /\.\w+\(\w+:\s*any\s*=>\s*{/.test(content);
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixTypeScriptSyntax(content);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed TypeScript syntax in ${file}`);
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
