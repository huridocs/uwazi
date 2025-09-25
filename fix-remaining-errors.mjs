#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function findActualFile(targetPath, baseDir) {
  const candidates = [
    `${targetPath}.ts`,
    `${targetPath}.tsx`,
    `${targetPath}.js`,
    `${targetPath}.jsx`,
    path.join(targetPath, 'index.ts'),
    path.join(targetPath, 'index.tsx'),
    path.join(targetPath, 'index.js'),
    path.join(targetPath, 'index.jsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveImportPath(filePath, importPath) {
  const fileDir = path.dirname(filePath);
  let targetPath;
  
  // Handle V2/Components/UI imports (Storybook)
  if (importPath.startsWith('V2/')) {
    targetPath = path.join(repoRoot, 'app', 'react', importPath);
  }
  // Handle relative imports
  else if (importPath.startsWith('./') || importPath.startsWith('../')) {
    targetPath = path.resolve(fileDir, importPath);
  }
  // Handle absolute imports from repo root
  else {
    targetPath = path.join(repoRoot, importPath);
  }

  const actualFile = findActualFile(targetPath, fileDir);
  if (actualFile) {
    let relPath = path.relative(fileDir, actualFile);
    relPath = toPosix(relPath);
    if (!relPath.startsWith('.')) relPath = `./${relPath}`;
    
    // Ensure .js extension for ESM
    if (relPath.endsWith('.ts') || relPath.endsWith('.tsx')) {
      relPath = relPath.replace(/\.tsx?$/, '.js');
    } else if (relPath.endsWith('/index.ts') || relPath.endsWith('/index.tsx')) {
      relPath = relPath.replace(/\/index\.tsx?$/, '/index.js');
    } else if (!/\.(js|mjs|cjs)$/.test(relPath)) {
      relPath = `${relPath}.js`;
    }
    
    return relPath;
  }
  
  return null;
}

function fixImportsInContent(filePath, content) {
  let changed = false;
  let modifiedContent = content;

  // Fix V2/Components/UI imports (Storybook)
  modifiedContent = modifiedContent.replace(
    /from\s+(["'])V2\/([^"']+)\1/g,
    (match, quote, path) => {
      const resolved = resolveImportPath(filePath, `V2/${path}`);
      if (resolved) {
        changed = true;
        return `from ${quote}${resolved}${quote}`;
      }
      return match;
    }
  );

  // Fix relative imports that might be incorrect
  modifiedContent = modifiedContent.replace(
    /from\s+(["'])(\.\.?\/[^"']+)\1/g,
    (match, quote, importPath) => {
      const resolved = resolveImportPath(filePath, importPath);
      if (resolved && resolved !== importPath) {
        changed = true;
        return `from ${quote}${resolved}${quote}`;
      }
      return match;
    }
  );

  // Fix missing config.js imports
  if (modifiedContent.includes("from '../config.js'") || modifiedContent.includes('from "../config.js"')) {
    const configPath = path.join(repoRoot, 'app', 'api', 'config', 'index.js');
    if (fs.existsSync(configPath)) {
      modifiedContent = modifiedContent.replace(
        /from\s+(["'])\.\.\/config\.js\1/g,
        (match, quote) => {
          changed = true;
          return `from ${quote}../api/config/index.js${quote}`;
        }
      );
    }
  }

  // Fix missing odm/index.js imports
  if (modifiedContent.includes("from '../odm/index.js'") || modifiedContent.includes('from "../odm/index.js"')) {
    const odmPath = path.join(repoRoot, 'app', 'api', 'odm', 'index.js');
    if (fs.existsSync(odmPath)) {
      modifiedContent = modifiedContent.replace(
        /from\s+(["'])\.\.\/odm\/index\.js\1/g,
        (match, quote) => {
          changed = true;
          return `from ${quote}../api/odm/index.js${quote}`;
        }
      );
    }
  }

  // Fix missing shared/tsUtils.js imports
  if (modifiedContent.includes("from '../../shared/tsUtils.js'") || modifiedContent.includes('from "../../shared/tsUtils.js"')) {
    const tsUtilsPath = path.join(repoRoot, 'app', 'shared', 'tsUtils.js');
    if (fs.existsSync(tsUtilsPath)) {
      modifiedContent = modifiedContent.replace(
        /from\s+(["'])\.\.\/\.\.\/shared\/tsUtils\.js\1/g,
        (match, quote) => {
          changed = true;
          return `from ${quote}../../shared/tsUtils.js${quote}`;
        }
      );
    }
  }

  // Fix missing utils/index.js imports
  if (modifiedContent.includes("from 'app/utils/index.js'") || modifiedContent.includes('from "../../utils/index.js"')) {
    const utilsPath = path.join(repoRoot, 'app', 'api', 'utils', 'index.js');
    if (fs.existsSync(utilsPath)) {
      modifiedContent = modifiedContent.replace(
        /from\s+(["'])\.\.\/\.\.\/utils\/index\.js\1/g,
        (match, quote) => {
          changed = true;
          return `from ${quote}../../api/utils/index.js${quote}`;
        }
      );
    }
  }

  // Fix missing istore.js imports
  if (modifiedContent.includes("from '../istore.js'") || modifiedContent.includes('from "../istore.js"')) {
    const istorePath = path.join(repoRoot, 'app', 'shared', 'istore.js');
    if (fs.existsSync(istorePath)) {
      modifiedContent = modifiedContent.replace(
        /from\s+(["'])\.\.\/istore\.js\1/g,
        (match, quote) => {
          changed = true;
          return `from ${quote}../shared/istore.js${quote}`;
        }
      );
    }
  }

  return { content: modifiedContent, changed };
}

function fixTypeScriptTypes(content) {
  let changed = false;
  let modifiedContent = content;

  // Fix implicit any types in function parameters
  modifiedContent = modifiedContent.replace(
    /(\w+)\s*=>\s*{/g,
    (match, param) => {
      if (!match.includes(':')) {
        changed = true;
        return `${param}: any => {`;
      }
      return match;
    }
  );

  // Fix implicit any types in catch blocks
  modifiedContent = modifiedContent.replace(
    /\.catch\s*\(\s*(\w+)\s*=>\s*{/g,
    (match, param) => {
      if (!match.includes(':')) {
        changed = true;
        return `.catch((${param}: any) => {`;
      }
      return match;
    }
  );

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing remaining import errors...');
  
  // Find all TypeScript and JavaScript files
  const files = await glob('**/*.{ts,js,tsx,jsx}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has problematic imports
      const hasIssues = /from\s+['"]V2\//.test(content) || 
                       /from\s+['"]\.\.\/config\.js['"]/.test(content) ||
                       /from\s+['"]\.\.\/odm\/index\.js['"]/.test(content) ||
                       /from\s+['"]\.\.\/\.\.\/shared\/tsUtils\.js['"]/.test(content) ||
                       /from\s+['"]\.\.\/\.\.\/utils\/index\.js['"]/.test(content) ||
                       /from\s+['"]\.\.\/istore\.js['"]/.test(content);
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      let { content: modifiedContent, changed } = fixImportsInContent(file, content);
      
      // Also fix TypeScript types if needed
      const typeFix = fixTypeScriptTypes(modifiedContent);
      if (typeFix.changed) {
        modifiedContent = typeFix.content;
        changed = true;
      }
      
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
