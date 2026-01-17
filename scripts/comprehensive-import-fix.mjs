import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { execSync } from 'child_process';

console.log('🔍 Extracting all errors...\n');

const missingModules = new Set();
const fileErrors = new Map();

function extractWebpackErrors() {
  try {
    const output = execSync('timeout 30 yarn hot 2>&1 || true', { 
      encoding: 'utf-8', 
      maxBuffer: 50 * 1024 * 1024,
      cwd: process.cwd()
    });
    
    const lines = output.split('\n');
    let currentFile = null;
    
    for (const line of lines) {
      const fileMatch = line.match(/ERROR in (\.\/[^\s]+)/);
      if (fileMatch) {
        currentFile = fileMatch[1].replace(/^\.\//, 'app/');
      }
      
      const moduleMatch = line.match(/Can't resolve '([^']+)'/);
      if (moduleMatch && currentFile) {
        const missing = moduleMatch[1].replace(process.cwd() + '/', '');
        missingModules.add(missing);
        if (!fileErrors.has(currentFile)) {
          fileErrors.set(currentFile, []);
        }
        fileErrors.get(currentFile).push(missing);
      }
    }
  } catch (error) {
    console.log('Note: Could not run yarn hot');
  }
}

function extractTypeScriptErrors() {
  try {
    const output = execSync('yarn check-types 2>&1 | grep "Cannot find module" || true', { 
      encoding: 'utf-8', 
      maxBuffer: 50 * 1024 * 1024,
      cwd: process.cwd()
    });
    
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/Cannot find module ['"]([^'"]+)['"]/);
      if (match) {
        missingModules.add(match[1]);
      }
    }
  } catch (error) {
    console.log('Note: Could not extract TypeScript errors');
  }
}

function findActualFile(missingPath) {
  const cleanPath = missingPath
    .replace(/^#app\//, 'app/react/')
    .replace(/^#api\//, 'app/api/')
    .replace(/^#shared\//, 'app/shared/')
    .replace(/^#UI\//, 'app/react/UI/')
    .replace(/^#V2\//, 'app/react/V2/')
    .replace(/^app\/react\//, 'app/react/')
    .replace(/^V2\//, 'app/react/V2/');
  
  if (cleanPath.includes('prod/') || cleanPath.includes('coverage/') || cleanPath.includes('node_modules/')) {
    return null;
  }
  
  const possibleExtensions = ['', '.js', '.jsx', '.ts', '.tsx'];
  const possiblePaths = [
    cleanPath,
    cleanPath + '/index.js',
    cleanPath + '/index.ts',
    cleanPath + '/index.tsx',
    cleanPath + '/index.jsx',
  ];
  
  for (const ext of possibleExtensions) {
    for (const path of possiblePaths) {
      const fullPath = path + ext;
      if (existsSync(fullPath) && !fullPath.includes('prod/') && !fullPath.includes('coverage/')) {
        return fullPath;
      }
    }
  }
  
  const parts = cleanPath.split('/');
  const fileName = parts[parts.length - 1];
  const dir = parts.slice(0, -1).join('/');
  
  const searchPatterns = [
    `${dir}/**/${fileName}.*`,
    `**/${fileName}.*`,
  ];
  
  for (const pattern of searchPatterns) {
    try {
      const matches = glob.sync(pattern, { 
        ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*', '**/prod/**', '**/coverage/**'] 
      });
      const validMatches = matches.filter(m => !m.includes('prod/') && !m.includes('coverage/'));
      if (validMatches.length > 0) {
        return validMatches[0];
      }
    } catch (e) {
      // continue
    }
  }
  
  return null;
}

async function main() {
  console.log('Extracting webpack errors...');
  extractWebpackErrors();
  
  console.log('Extracting TypeScript errors...');
  extractTypeScriptErrors();
  
  console.log(`\nFound ${missingModules.size} unique missing modules\n`);
  
  const replacements = new Map();
  
  for (const missing of missingModules) {
    const actualFile = findActualFile(missing);
    if (actualFile) {
      const importPath = actualFile
        .replace(/^app\/react\//, '#app/')
        .replace(/^app\/api\//, '#api/')
        .replace(/^app\/shared\//, '#shared/');
      
      const ext = actualFile.match(/\.(js|jsx|ts|tsx)$/)?.[0] || '.js';
      const runtimeExt = ext === '.ts' ? '.js' : ext === '.tsx' ? '.jsx' : ext;
      const correctPath = importPath.replace(/\.(js|jsx|ts|tsx)$/, runtimeExt);
      
      if (missing !== correctPath) {
        replacements.set(missing, correctPath);
        console.log(`  ${missing} → ${correctPath}`);
      }
    } else {
      console.log(`  ❌ Could not find: ${missing}`);
    }
  }
  
  console.log(`\n✨ Found ${replacements.size} import patterns to fix\n`);
  
  if (replacements.size === 0) {
    console.log('No replacements needed.');
    return;
  }
  
  const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
  });
  
  let totalFixed = 0;
  
  for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    let modified = false;
    
    for (const [wrongPath, correctPath] of replacements.entries()) {
      const escaped = wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = [
        new RegExp(`(['"])${escaped}(['"])`, 'g'),
        new RegExp(`from\\s+(['"])${escaped}(['"])`, 'g'),
        new RegExp(`import\\s+.*?from\\s+(['"])${escaped}(['"])`, 'g'),
      ];
      
      for (const pattern of patterns) {
        const newContent = content.replace(pattern, (match, quote1, quote2) => {
          return match.replace(wrongPath, correctPath);
        });
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }
    
    if (modified) {
      writeFileSync(file, content, 'utf-8');
      totalFixed++;
    }
  }
  
  console.log(`✅ Fixed ${totalFixed} files`);
}

main().catch(console.error);
