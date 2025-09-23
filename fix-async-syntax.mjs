#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixAsyncSyntax(content) {
  let changed = false;
  let modifiedContent = content;

  // Fix incorrect async parameter type annotations
  // Pattern: async param: any => should be async (param: any) =>
  modifiedContent = modifiedContent.replace(
    /async\s+(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `async (${param}: any) => {`;
    }
  );

  // Fix incorrect async parameter type annotations in map
  // Pattern: .map(async param: any => should be .map(async (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.map\(async\s+(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.map(async (${param}: any) => {`;
    }
  );

  // Fix incorrect async parameter type annotations in forEach
  // Pattern: .forEach(async param: any => should be .forEach(async (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.forEach\(async\s+(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.forEach(async (${param}: any) => {`;
    }
  );

  // Fix incorrect async parameter type annotations in filter
  // Pattern: .filter(async param: any => should be .filter(async (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.filter\(async\s+(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.filter(async (${param}: any) => {`;
    }
  );

  // Fix incorrect async parameter type annotations in reduce
  // Pattern: .reduce(async param: any => should be .reduce(async (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.reduce\(async\s+(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.reduce(async (${param}: any) => {`;
    }
  );

  // Fix incorrect async parameter type annotations in then
  // Pattern: .then(async param: any => should be .then(async (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.then\(async\s+(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.then(async (${param}: any) => {`;
    }
  );

  // Fix incorrect async parameter type annotations in catch
  // Pattern: .catch(async param: any => should be .catch(async (param: any) =>
  modifiedContent = modifiedContent.replace(
    /\.catch\(async\s+(\w+):\s*any\s*=>\s*{/g,
    (match, param) => {
      changed = true;
      return `.catch(async (${param}: any) => {`;
    }
  );

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing async syntax errors...');
  
  // Find all TypeScript files
  const files = await glob('**/*.{ts,tsx}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has async syntax issues
      const hasIssues = /async\s+\w+:\s*any\s*=>\s*{/.test(content);
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixAsyncSyntax(content);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed async syntax in ${file}`);
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
