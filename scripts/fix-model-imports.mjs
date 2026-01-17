#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const modelMappings = {
  'passwordRecoveriesModel': 'app/api/users/passwordRecoveriesModel',
  'usersModel': 'app/api/users/usersModel',
  'migrationsModel': 'app/api/migrations/migrationsModel',
  'tenantsModel': 'app/api/tenants/tenantsModel',
  'settingsModel': 'app/api/settings/settingsModel',
  'templatesModel': 'app/api/templates/templatesModel',
  'pagesModel': 'app/api/pages/pagesModel',
  'thesauriModel': 'app/api/thesauri/thesauriModel',
  'segmentationModel': 'app/api/services/pdfsegmentation/segmentationModel',
  'ocrModel': 'app/api/services/ocr/ocrModel',
  'ocrRecords': 'app/api/services/ocr/ocrRecords',
  'updatelogsModel': 'app/api/updatelogs/updatelogsModel',
  'syncsModel': 'app/api/sync/syncsModel',
  'preserveSyncModel': 'app/api/preserve/preserveSyncModel',
};

function findFile(baseName) {
  const baseDir = path.join(projectRoot, 'app/api');
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  for (const ext of extensions) {
    const fullPath = path.join(baseDir, baseName + ext);
    if (existsSync(fullPath)) {
      return ext;
    }
  }
  
  return null;
}

function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  const importRegex = /from\s+['"]([^'"]+)['"]/g;

  newContent = newContent.replace(importRegex, (match, importPath) => {
    if (!importPath.startsWith('#api/')) {
      return match;
    }

    const cleanPath = importPath.replace(/\.(js|ts|tsx|jsx)$/, '');
    
    for (const [modelName, actualPath] of Object.entries(modelMappings)) {
      if (cleanPath === `#api/${modelName}`) {
        const ext = findFile(actualPath);
        if (ext) {
          const relativePath = path.relative(path.join(projectRoot, 'app/api'), actualPath);
          const newImport = `#api/${relativePath.replace(/\\/g, '/')}${ext}`;
          modified = true;
          return match.replace(importPath, newImport);
        }
      }
    }

    return match;
  });

  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Finding files with model imports to fix...');

  const patterns = [
    'app/**/*.{js,jsx,ts,tsx}',
  ];

  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**'],
    });
    files.push(...matches);
  }

  console.log(`📁 Found ${files.length} files to check`);

  let fixedCount = 0;
  for (const file of files) {
    try {
      if (fixImportsInFile(file)) {
        fixedCount++;
        console.log(`✅ Fixed: ${path.relative(projectRoot, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} files`);
}

main().catch(console.error);
