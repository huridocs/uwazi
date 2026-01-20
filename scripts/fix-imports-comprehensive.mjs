#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const packageJson = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
const importMaps = packageJson.imports || {};

function resolveImportMap(importPath) {
  if (importPath.startsWith('#api/')) {
    const rest = importPath.slice(5);
    return path.join(projectRoot, 'app', 'api', rest);
  }
  if (importPath.startsWith('#shared/')) {
    const rest = importPath.slice(8);
    return path.join(projectRoot, 'app', 'shared', rest);
  }
  if (importPath.startsWith('#app/')) {
    const rest = importPath.slice(5);
    return path.join(projectRoot, 'app', 'react', rest);
  }
  if (importPath.startsWith('#UI/')) {
    const rest = importPath.slice(4);
    return path.join(projectRoot, 'app', 'react', 'UI', rest);
  }
  if (importPath.startsWith('#V2/')) {
    const rest = importPath.slice(4);
    return path.join(projectRoot, 'app', 'react', 'V2', rest);
  }
  return null;
}

function findFile(searchPath, fromFile) {
  const basePath = searchPath.replace(/\.(js|ts|tsx|jsx)$/, '');
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  if (searchPath.includes('common.v2/database/getConnectionForCurrentTenant')) {
    const correctPath = path.join(projectRoot, 'app', 'api', 'core', 'infrastructure', 'mongodb', 'common', 'getConnectionForCurrentTenant.ts');
    if (existsSync(correctPath)) {
      return correctPath;
    }
  }

  const fileName = path.basename(basePath);
  const searchDir = path.dirname(basePath);
  
  if (existsSync(searchDir)) {
    const files = glob.sync('**/*', { cwd: searchDir, absolute: true });
    const matching = files.find(f => {
      const base = path.basename(f, path.extname(f));
      return base === fileName || base === 'index';
    });
    if (matching) return matching;
  }

  return null;
}

function toESMExtension(filePath) {
  if (!filePath) return null;
  const ext = path.extname(filePath);
  if (ext === '.ts') return '.js';
  if (ext === '.tsx') return '.jsx';
  return ext;
}

function convertToImportPath(filePath, fromFile) {
  if (!filePath) return null;
  
  const relPath = path.relative(path.dirname(fromFile), filePath);
  let importPath = relPath.split(path.sep).join('/');
  
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }
  
  const ext = toESMExtension(filePath);
  if (ext) {
    importPath = importPath.replace(/\.(ts|tsx|js|jsx)$/, ext);
  }
  
  return importPath;
}

function convertToImportMapPath(filePath) {
  const relPath = path.relative(projectRoot, filePath);
  const parts = relPath.split(path.sep);
  
  if (parts[0] === 'app' && parts[1] === 'api') {
    const rest = parts.slice(2).join('/');
    return `#api/${rest}`;
  }
  if (parts[0] === 'app' && parts[1] === 'shared') {
    const rest = parts.slice(2).join('/');
    return `#shared/${rest}`;
  }
  if (parts[0] === 'app' && parts[1] === 'react') {
    if (parts[2] === 'UI') {
      const rest = parts.slice(3).join('/');
      return `#UI/${rest}`;
    }
    if (parts[2] === 'V2') {
      const rest = parts.slice(3).join('/');
      return `#V2/${rest}`;
    }
    const rest = parts.slice(2).join('/');
    return `#app/${rest}`;
  }
  
  return null;
}

function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  const importPatterns = [
    /from\s+(['"])([^'"]+)(['"])/g,
    /import\s+.*from\s+(['"])([^'"]+)(['"])/g,
    /require\((['"])([^'"]+)(['"])\)/g,
  ];

  for (const pattern of importPatterns) {
    newContent = newContent.replace(pattern, (match, quote1, importPath, quote2) => {
      if (importPath.startsWith('.')) {
        const resolved = path.resolve(path.dirname(filePath), importPath);
        const ext = path.extname(resolved);
        const basePath = resolved.replace(/\.(js|ts|tsx|jsx)$/, '');
        const found = findFile(basePath, filePath);
        
        if (found && found !== resolved) {
          const newImport = convertToImportPath(found, filePath);
          if (newImport && newImport !== importPath) {
            modified = true;
            return match.replace(importPath, newImport);
          }
        }
        
        const candidates = [
          `${basePath}.ts`,
          `${basePath}.tsx`,
          `${basePath}.js`,
          `${basePath}.jsx`,
          path.join(basePath, 'index.ts'),
          path.join(basePath, 'index.tsx'),
          path.join(basePath, 'index.js'),
          path.join(basePath, 'index.jsx'),
        ];
        
        for (const candidate of candidates) {
          if (existsSync(candidate)) {
            const newImport = convertToImportPath(candidate, filePath);
            if (newImport && newImport !== importPath) {
              modified = true;
              return match.replace(importPath, newImport);
            }
            break;
          }
        }
        
        return match;
      }

      if (importPath.startsWith('#api/') || importPath.startsWith('#shared/') || 
          importPath.startsWith('#app/') || importPath.startsWith('#UI/') || 
          importPath.startsWith('#V2/')) {
        const resolved = resolveImportMap(importPath);
        if (resolved) {
          const found = findFile(resolved, filePath);
          if (found) {
            const importMapPath = convertToImportMapPath(found);
            if (importMapPath && importMapPath !== importPath) {
              const ext = toESMExtension(found);
              const finalPath = importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + ext;
              if (finalPath !== importPath) {
                modified = true;
                return match.replace(importPath, finalPath);
              }
            }
          }
        }
      }

      return match;
    });
  }

  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Scanning files for broken imports...\n');

  const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/specs/**', '**/*.spec.*'],
  });

  console.log(`📁 Found ${files.length} files to check\n`);

  let fixedCount = 0;
  const errors = [];

  for (const file of files) {
    try {
      if (fixImportsInFile(file)) {
        fixedCount++;
        console.log(`✅ Fixed: ${path.relative(projectRoot, file)}`);
      }
    } catch (error) {
      errors.push({ file, error: error.message });
      console.error(`❌ Error in ${path.relative(projectRoot, file)}: ${error.message}`);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} files`);
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors occurred`);
  }
}

main().catch(console.error);
