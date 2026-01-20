#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const knownMappings = {
  '#api/common.v2/database/MongoDataSource.js': '#api/core/infrastructure/mongodb/common/MongoDataSource.js',
  '#api/common.v2/database/MongoDataSource': '#api/core/infrastructure/mongodb/common/MongoDataSource.js',
  '#api/common.v2/database/MongoTransactionManager.js': '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js',
  '#api/common.v2/database/MongoTransactionManager': '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js',
  '#api/common.v2/database/MongoResultSet.js': '#api/core/infrastructure/mongodb/common/MongoResultSet.js',
  '#api/common.v2/database/MongoResultSet': '#api/core/infrastructure/mongodb/common/MongoResultSet.js',
  '#api/common.v2/database/MongoIdGenerator.js': '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js',
  '#api/common.v2/database/MongoIdGenerator': '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js',
};

function resolveImportPath(importPath, fromFile) {
  if (knownMappings[importPath]) {
    return knownMappings[importPath];
  }

  if (importPath.startsWith('#api/') || importPath.startsWith('#shared/') || 
      importPath.startsWith('#app/') || importPath.startsWith('#UI/') || 
      importPath.startsWith('#V2/')) {
    const cleanPath = importPath.replace(/\.(js|ts|tsx|jsx)$/, '');
    if (knownMappings[cleanPath]) {
      return knownMappings[cleanPath];
    }

    let resolved;
    if (importPath.startsWith('#api/')) {
      resolved = path.join(projectRoot, 'app', 'api', importPath.slice(5));
    } else if (importPath.startsWith('#shared/')) {
      resolved = path.join(projectRoot, 'app', 'shared', importPath.slice(8));
    } else if (importPath.startsWith('#app/')) {
      resolved = path.join(projectRoot, 'app', 'react', importPath.slice(5));
    } else if (importPath.startsWith('#UI/')) {
      resolved = path.join(projectRoot, 'app', 'react', 'UI', importPath.slice(4));
    } else if (importPath.startsWith('#V2/')) {
      resolved = path.join(projectRoot, 'app', 'react', 'V2', importPath.slice(4));
    }

    if (resolved) {
      const basePath = resolved.replace(/\.(js|ts|tsx|jsx)$/, '');
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      
      for (const ext of extensions) {
        const candidate = basePath + ext;
        if (existsSync(candidate)) {
          const importMapPath = convertToImportMapPath(candidate);
          if (importMapPath) {
            const esmExt = ext === '.ts' ? '.js' : ext === '.tsx' ? '.jsx' : ext;
            return importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + esmExt;
          }
        }
        
        const indexCandidate = path.join(basePath, 'index' + ext);
        if (existsSync(indexCandidate)) {
          const importMapPath = convertToImportMapPath(indexCandidate);
          if (importMapPath) {
            const esmExt = ext === '.ts' ? '.js' : ext === '.tsx' ? '.jsx' : ext;
            return importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + esmExt;
          }
        }
      }
    }
  }

  if (importPath.startsWith('.')) {
    const resolved = path.resolve(path.dirname(fromFile), importPath);
    const basePath = resolved.replace(/\.(js|ts|tsx|jsx)$/, '');
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    for (const ext of extensions) {
      const candidate = basePath + ext;
      if (existsSync(candidate)) {
        const relPath = path.relative(path.dirname(fromFile), candidate);
        let importPath = relPath.split(path.sep).join('/');
        if (!importPath.startsWith('.')) importPath = './' + importPath;
        const esmExt = ext === '.ts' ? '.js' : ext === '.tsx' ? '.jsx' : ext;
        return importPath.replace(/\.(js|ts|tsx|jsx)$/, '') + esmExt;
      }
      
      const indexCandidate = path.join(basePath, 'index' + ext);
      if (existsSync(indexCandidate)) {
        const relPath = path.relative(path.dirname(fromFile), indexCandidate);
        let importPath = relPath.split(path.sep).join('/');
        if (!importPath.startsWith('.')) importPath = './' + importPath;
        const esmExt = ext === '.ts' ? '.js' : ext === '.tsx' ? '.jsx' : ext;
        return importPath.replace(/\.(js|ts|tsx|jsx)$/, '') + esmExt;
      }
    }
  }

  return null;
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

  const patterns = [
    /from\s+(['"])([^'"]+)(['"])/g,
    /import\s+.*from\s+(['"])([^'"]+)(['"])/g,
  ];

  for (const pattern of patterns) {
    newContent = newContent.replace(pattern, (match, quote1, importPath, quote2) => {
      const resolved = resolveImportPath(importPath, filePath);
      if (resolved && resolved !== importPath) {
        modified = true;
        return match.replace(importPath, resolved);
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
  console.log('🔍 Finding and fixing broken imports...\n');

  const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/specs/**', '**/*.spec.*'],
  });

  let fixedCount = 0;

  for (const file of files) {
    try {
      if (fixImportsInFile(file)) {
        fixedCount++;
        console.log(`✅ Fixed: ${path.relative(projectRoot, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error in ${path.relative(projectRoot, file)}: ${error.message}`);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} files`);
}

main().catch(console.error);
