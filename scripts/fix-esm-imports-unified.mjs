#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const knownPathMappings = {
  '#api/common.v2/database/getConnectionForCurrentTenant': '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant',
  '#api/common.v2/database/MongoDataSource': '#api/core/infrastructure/mongodb/common/MongoDataSource',
  '#api/common.v2/database/MongoTransactionManager': '#api/core/infrastructure/mongodb/common/MongoTransactionManager',
  '#api/common.v2/database/MongoResultSet': '#api/core/infrastructure/mongodb/common/MongoResultSet',
  '#api/common.v2/database/MongoIdGenerator': '#api/core/infrastructure/mongodb/common/MongoIdGenerator',
  '#api/templates.v2/model/RelationshipProperty': '#api/core/domain/template/RelationshipProperty',
  '#api/templates.v2/model/V1RelationshipProperty': '#api/core/domain/template/V1RelationshipProperty',
  '#api/templates.v2/model/Property': '#api/core/domain/template/Property',
  '#api/templates.v2/model/Template': '#api/core/domain/template/Template',
  '#api/templates.v2/model/CommonProperty': '#api/core/domain/template/CommonProperty',
  '#api/templates.v2/database/MongoTemplatesDataSource': '#api/core/infrastructure/mongodb/template/MongoTemplatesDataSource',
  '#api/core/infrastructure/errors/settingsErrors': '#api/core/infrastructure/mongodb/errors/settingsErrors',
  '../errors/settingsErrors': '#api/core/infrastructure/mongodb/errors/settingsErrors',
  '#api/settings.v2/database/MongoSettingsDataSource': '#api/core/infrastructure/mongodb/MongoSettingsDataSource',
  '#api/templates.v2/services/TemplateInputMappers': '#api/core/v1_layer/templates.v2/services/TemplateInputMappers',
  '#api/services/suggestions/suggestions': '#api/suggestions/suggestions',
  '../services/suggestions/suggestions': '#api/suggestions/suggestions',
  '#api/templates/v2_support': '#api/core/v1_layer/templates/v2_support',
  '../templates/v2_support': '#api/core/v1_layer/templates/v2_support',
  '#api/eventsbus': '#api/core/libs/eventsbus',
  '#api/files.v2/model/URLAttachment': '#api/core/domain/files/URLAttachment',
  '#api/eventsbus/index': '#api/core/libs/eventsbus/index',
  '../eventsbus': '#api/core/libs/eventsbus',
  '../eventsbus/index': '#api/core/libs/eventsbus/index',
  '../templates/events/TemplateDeletedEvent': '#api/core/domain/template/events/TemplateDeletedEvent',
  '../templates/events/TemplateUpdatedEvent': '#api/core/domain/template/events/TemplateUpdatedEvent',
  '#api/templates/events/TemplateDeletedEvent': '#api/core/domain/template/events/TemplateDeletedEvent',
  '#api/templates/events/TemplateUpdatedEvent': '#api/core/domain/template/events/TemplateUpdatedEvent',
  '#api/queue.v2/application/contracts/UserAwareDispatchable': '#api/core/libs/queue/application/contracts/UserAwareDispatchable',
  '#api/queue.v2/application/contracts/JobsDispatcher': '#api/core/libs/queue/application/contracts/JobsDispatcher',
  '#api/queue.v2/application/contracts/Dispatchable': '#api/core/libs/queue/application/contracts/Dispatchable',
  '#api/queue.v2/configuration/factories': '#api/core/libs/queue/configuration/factories',
  '#api/queue.v2/infrastructure/SyncDispatcherForTests': '#api/core/libs/queue/infrastructure/SyncDispatcherForTests',
  '#api/queue.v2/infrastructure/errors': '#api/core/libs/queue/infrastructure/errors',
  '../queue.v2/infrastructure/errors': '#api/core/libs/queue/infrastructure/errors',
  '../queue.v2/application/contracts/JobsDispatcher': '#api/core/libs/queue/application/contracts/JobsDispatcher',
  '../queue.v2/application/contracts/Dispatchable': '#api/core/libs/queue/application/contracts/Dispatchable',
  '../queue.v2/configuration/factories': '#api/core/libs/queue/configuration/factories',
  '../queue.v2/infrastructure/SyncDispatcherForTests': '#api/core/libs/queue/infrastructure/SyncDispatcherForTests',
  '../../../queue.v2/application/contracts/UserAwareDispatchable': '#api/core/libs/queue/application/contracts/UserAwareDispatchable',
  '../model/RelationshipProperty': '#api/core/domain/template/RelationshipProperty',
  '../model/V1RelationshipProperty': '#api/core/domain/template/V1RelationshipProperty',
  '../model/Property': '#api/core/domain/template/Property',
  '../model/Template': '#api/core/domain/template/Template',
  '../model/CommonProperty': '#api/core/domain/template/CommonProperty',
  '../contracts/TemplatesDataSource': '#api/core/application/contracts/TemplatesDataSource',
};

let fileCache = null;

async function buildFileCache() {
  if (fileCache) return fileCache;
  
  fileCache = new Map();
  const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/coverage/**'],
  });
  
  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const parts = relPath.split(path.sep);
    const baseName = path.basename(file, path.extname(file));
    const dirName = parts.length > 2 ? parts[parts.length - 2] : '';
    
    const key1 = `${parts[1]}/${baseName}`;
    const key2 = dirName ? `${parts[1]}/${dirName}/${baseName}` : null;
    
    if (!fileCache.has(key1)) fileCache.set(key1, []);
    fileCache.get(key1).push(file);
    
    if (key2 && !fileCache.has(key2)) fileCache.set(key2, []);
    if (key2) fileCache.get(key2).push(file);
  }
  
  return fileCache;
}

function resolveImportMapPath(importPath) {
  if (importPath.startsWith('#api/')) {
    return path.join(projectRoot, 'app', 'api', importPath.slice(5));
  }
  if (importPath.startsWith('#shared/')) {
    return path.join(projectRoot, 'app', 'shared', importPath.slice(8));
  }
  if (importPath.startsWith('#app/')) {
    return path.join(projectRoot, 'app', 'react', importPath.slice(5));
  }
  if (importPath.startsWith('#UI/')) {
    return path.join(projectRoot, 'app', 'react', 'UI', importPath.slice(4));
  }
  if (importPath.startsWith('#V2/')) {
    return path.join(projectRoot, 'app', 'react', 'V2', importPath.slice(4));
  }
  return null;
}

function findActualFile(searchPath, fromFile) {
  if (typeof searchPath === 'string' && existsSync(searchPath)) {
    return searchPath;
  }
  
  const basePath = searchPath.replace(/\.(js|ts|tsx|jsx)$/, '');
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  for (const ext of extensions) {
    const candidate = basePath + ext;
    if (existsSync(candidate)) return candidate;
    
    const indexCandidate = path.join(basePath, 'index' + ext);
    if (existsSync(indexCandidate)) return indexCandidate;
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

function toESMExtension(filePath) {
  if (!filePath) return '.js';
  const ext = path.extname(filePath);
  if (ext === '.ts') return '.js';
  if (ext === '.tsx') return '.jsx';
  return ext || '.js';
}

function resolveImport(importPath, fromFile) {
  const cleanPath = importPath.replace(/\.(js|ts|tsx|jsx)$/, '');
  
  for (const [key, value] of Object.entries(knownPathMappings)) {
    if (importPath === key || cleanPath === key || importPath.startsWith(key + '/') || cleanPath.startsWith(key + '/')) {
      const mapped = value + (importPath.slice(key.length) || '');
      const resolved = resolveImportMapPath(mapped);
      if (resolved) {
        const found = findActualFile(resolved, fromFile);
        if (found) {
          const importMapPath = convertToImportMapPath(found);
          if (importMapPath) {
            return importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + toESMExtension(found);
          }
        }
      }
    }
  }
  
  if (knownPathMappings[cleanPath] || knownPathMappings[importPath]) {
    const mapped = knownPathMappings[cleanPath] || knownPathMappings[importPath];
    const resolved = resolveImportMapPath(mapped);
    if (resolved) {
      const found = findActualFile(resolved, fromFile);
      if (found) {
        const importMapPath = convertToImportMapPath(found);
        if (importMapPath) {
          return importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + toESMExtension(found);
        }
      }
    }
  }
  
  if (importPath.startsWith('#')) {
    const resolved = resolveImportMapPath(importPath);
    if (resolved) {
      const found = findActualFile(resolved, fromFile);
      if (found) {
        const importMapPath = convertToImportMapPath(found);
        if (importMapPath) {
          return importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + toESMExtension(found);
        }
      }
    }
  }
  
  if (importPath.startsWith('.')) {
    const resolved = path.resolve(path.dirname(fromFile), importPath);
    const found = findActualFile(resolved, fromFile);
    if (found) {
      const foundFileRel = path.relative(projectRoot, found);
      const foundParts = foundFileRel.split(path.sep);
      
      if (foundParts[0] === 'app' && (foundParts[1] === 'api' || foundParts[1] === 'shared' || foundParts[1] === 'react')) {
        const importMapPath = convertToImportMapPath(found);
        if (importMapPath) {
          return importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + toESMExtension(found);
        }
      }
    }
  }
  
  return null;
}

async function findFileByPattern(fileName, dirName, packageName) {
  await buildFileCache();
  
  const key1 = `${packageName}/${fileName}`;
  const key2 = dirName ? `${packageName}/${dirName}/${fileName}` : null;
  
  const candidates1 = fileCache.get(key1) || [];
  const candidates2 = key2 ? (fileCache.get(key2) || []) : [];
  
  const allCandidates = [...candidates1, ...candidates2];
  
  if (allCandidates.length === 1) {
    return allCandidates[0];
  }
  
  if (allCandidates.length > 1 && dirName) {
    const filtered = allCandidates.filter(f => f.includes(`/${dirName}/${fileName}`));
    if (filtered.length === 1) {
      return filtered[0];
    }
  }
  
  return null;
}

async function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  const patterns = [
    /from\s+(['"])([^'"]+)(['"])/g,
    /import\s+.*from\s+(['"])([^'"]+)(['"])/g,
    /export\s+.*from\s+(['"])([^'"]+)(['"])/g,
  ];

  for (const pattern of patterns) {
    newContent = newContent.replace(pattern, (fullMatch, quote1, importPath, quote2) => {
      if (importPath.startsWith('http://') || importPath.startsWith('https://') || 
          importPath.startsWith('data:') || importPath.startsWith('node:')) {
        return fullMatch;
      }
      
      if ((importPath.startsWith('api/') || importPath.startsWith('shared/') || importPath.startsWith('app/')) && !importPath.startsWith('#')) {
        const prefix = importPath.startsWith('api/') ? '#api/' : importPath.startsWith('shared/') ? '#shared/' : '#app/';
        const rest = importPath.replace(/^(api|shared|app)\//, '');
        const newImport = prefix + rest;
        const resolved = resolveImportMapPath(newImport);
        if (resolved) {
          const found = findActualFile(resolved, filePath);
          if (found) {
            const importMapPath = convertToImportMapPath(found);
            if (importMapPath) {
              const final = importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + toESMExtension(found);
              modified = true;
              return fullMatch.replace(importPath, final);
            }
          }
        }
        const hasExt = /\.(js|ts|tsx|jsx)$/.test(rest);
        const final = newImport + (hasExt ? '' : '.js');
        modified = true;
        return fullMatch.replace(importPath, final);
      }
      
      if (importPath.startsWith('../') || importPath.startsWith('./')) {
        const resolved = path.resolve(path.dirname(filePath), importPath);
        let found = findActualFile(resolved, filePath);
        
        if (!found && importPath.includes('/')) {
          const importParts = importPath.split('/').filter(p => p && p !== '.' && p !== '..');
          const fileName = importParts[importParts.length - 1]?.replace(/\.(js|ts|tsx|jsx)$/, '') || '';
          const dirName = importParts.length > 1 ? importParts[importParts.length - 2] : null;
          
          const fileDirRel = path.relative(projectRoot, path.dirname(filePath));
          const fileDirParts = fileDirRel.split(path.sep);
          
          if ((fileDirParts[0] === 'app' || fileDirParts[0] === 'scripts') && 
              (fileDirParts[1] === 'api' || fileDirParts[1] === 'shared' || fileDirParts[1] === 'react' || fileDirParts[0] === 'scripts')) {
            const packageRoot = fileDirParts[0] === 'scripts' 
              ? path.join(projectRoot, 'app', 'api')
              : path.join(projectRoot, 'app', fileDirParts[1]);
            
            const searchPaths = [
              path.join(packageRoot, ...importParts),
              path.join(packageRoot, fileName),
            ];
            
            if (dirName) {
              searchPaths.push(path.join(packageRoot, dirName, fileName));
            }
            
            for (const searchPath of searchPaths) {
              const candidate = findActualFile(searchPath, filePath);
              if (candidate) {
                found = candidate;
                break;
              }
            }
            
          }
        }
        
        if (found) {
          const foundFileRel = path.relative(projectRoot, found);
          const foundParts = foundFileRel.split(path.sep);
          
          if (foundParts[0] === 'app' && (foundParts[1] === 'api' || foundParts[1] === 'shared' || foundParts[1] === 'react')) {
            const importMapPath = convertToImportMapPath(found);
            if (importMapPath) {
              const final = importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + toESMExtension(found);
              modified = true;
              return fullMatch.replace(importPath, final);
            }
          }
        }
      }
      
      const resolved = resolveImport(importPath, filePath);
      if (resolved && resolved !== importPath) {
        modified = true;
        return fullMatch.replace(importPath, resolved);
      }
      
      const cleanPath = importPath.replace(/\.(js|ts|tsx|jsx)$/, '');
      if (knownPathMappings[cleanPath] || knownPathMappings[importPath]) {
        const mapped = knownPathMappings[cleanPath] || knownPathMappings[importPath];
        const resolved = resolveImportMapPath(mapped);
        if (resolved) {
          const found = findActualFile(resolved, filePath);
          if (found) {
            const importMapPath = convertToImportMapPath(found);
            if (importMapPath) {
              const final = importMapPath.replace(/\.(js|ts|tsx|jsx)$/, '') + toESMExtension(found);
              if (final !== importPath) {
                modified = true;
                return fullMatch.replace(importPath, final);
              }
            }
          }
        }
      }
      
      return fullMatch;
    });
  }

  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Fixing ESM imports comprehensively...\n');
  
  await buildFileCache();

  const files = await glob('{app,scripts}/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/coverage/**'],
  });

  console.log(`📁 Found ${files.length} files to check\n`);

  let fixedCount = 0;
  const errors = [];

  for (const file of files) {
    try {
      if (await fixImportsInFile(file)) {
        fixedCount++;
        if (fixedCount <= 100 || fixedCount % 50 === 0) {
          console.log(`✅ Fixed: ${path.relative(projectRoot, file)}`);
        }
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
  console.log('\n💡 Run "yarn hot" to check for remaining errors');
}

main().catch(console.error);
