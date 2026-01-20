#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const importMaps = {
  '#api': './app/api',
  '#api/*': './app/api/*',
  '#shared': './app/shared',
  '#shared/*': './app/shared/*',
  '#app': './app/react',
  '#app/*': './app/react/*',
  '#UI': './app/react/UI',
  '#UI/*': './app/react/UI/*',
  '#V2': './app/react/V2',
  '#V2/*': './app/react/V2/*',
};

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

function findActualFile(searchPath) {
  if (typeof searchPath === 'string') {
    if (existsSync(searchPath)) return searchPath;
    
    const basePath = searchPath.replace(/\.(js|ts|tsx|jsx)$/, '');
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.d.ts'];
    
    for (const ext of extensions) {
      const candidate = basePath + ext;
      if (existsSync(candidate)) return candidate;
      
      const indexCandidate = path.join(basePath, 'index' + ext);
      if (existsSync(indexCandidate)) return indexCandidate;
    }
    
    const dirPath = basePath;
    if (existsSync(dirPath)) {
      const indexFiles = [
        path.join(dirPath, 'index.ts'),
        path.join(dirPath, 'index.tsx'),
        path.join(dirPath, 'index.js'),
        path.join(dirPath, 'index.jsx'),
        path.join(dirPath, 'index.d.ts'),
      ];
      for (const indexFile of indexFiles) {
        if (existsSync(indexFile)) return indexFile;
      }
    }
  }
  return null;
}

function resolveImport(importPath, fromFile) {
  if (importPath.startsWith('http://') || importPath.startsWith('https://') || 
      importPath.startsWith('data:') || importPath.startsWith('node:')) {
    return { valid: true, reason: 'external' };
  }
  
  let resolvedPath = null;
  
  if (importPath.startsWith('#')) {
    resolvedPath = resolveImportMapPath(importPath);
  } else if (importPath.startsWith('.')) {
    resolvedPath = path.resolve(path.dirname(fromFile), importPath);
  } else {
    return { valid: true, reason: 'node_modules' };
  }
  
  if (resolvedPath) {
    const found = findActualFile(resolvedPath);
    if (found) {
      return { valid: true, file: found };
    }
    
    const relativePath = path.relative(projectRoot, resolvedPath);
    return { 
      valid: false, 
      attempted: relativePath,
      suggestions: findSuggestions(importPath, fromFile)
    };
  }
  
  return { valid: false, reason: 'unresolved' };
}

function findSuggestions(importPath, fromFile) {
  const suggestions = [];
  const fromDir = path.dirname(fromFile);
  
  if (importPath.startsWith('#app/')) {
    const rest = importPath.slice(5);
    const parts = rest.split('/');
    const fileName = parts[parts.length - 1]?.replace(/\.(js|ts|tsx|jsx)$/, '') || '';
    
    try {
      const matches = glob.sync(`**/${fileName}*.{js,ts,tsx,jsx}`, {
        cwd: path.join(projectRoot, 'app', 'react'),
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
      });
      
      for (const match of matches.slice(0, 10)) {
        const relPath = path.relative(fromDir, match);
        let relImport = './' + relPath.replace(/\\/g, '/');
        relImport = relImport.replace(/\.(ts|tsx)$/, '.js');
        
        if (relImport !== importPath && !suggestions.includes(relImport)) {
          suggestions.push(relImport);
        }
        
        const matchRel = path.relative(projectRoot, match);
        if (matchRel.startsWith('app/react/')) {
          const importMapPath = '#app/' + matchRel.slice(10).replace(/\\/g, '/');
          const importMapPathJs = importMapPath.replace(/\.(ts|tsx)$/, '.js');
          if (importMapPathJs !== importPath && !suggestions.includes(importMapPathJs)) {
            suggestions.push(importMapPathJs);
          }
        }
      }
    } catch (e) {}
  }
  
  return suggestions.slice(0, 5);
}

async function validateImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const errors = [];
  
  const patterns = [
    /from\s+(['"])([^'"]+)(['"])/g,
    /import\s+.*from\s+(['"])([^'"]+)(['"])/g,
    /export\s+.*from\s+(['"])([^'"]+)(['"])/g,
  ];
  
  for (const pattern of patterns) {
    const matches = [...content.matchAll(pattern)];
    
    for (const match of matches) {
      const importPath = match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      const result = resolveImport(importPath, filePath);
      
      if (!result.valid) {
        errors.push({
          line: lineNumber,
          import: importPath,
          attempted: result.attempted,
          suggestions: result.suggestions || [],
        });
      }
    }
  }
  
  return errors;
}

function getTypeScriptErrors(files) {
  const errors = [];
  try {
    const tscOutput = execSync(
      `npx tsc --noEmit --pretty false 2>&1 || true`,
      { cwd: projectRoot, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, stdio: 'pipe' }
    );
    
    const lines = tscOutput.split('\n');
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS\d+: (.+)$/);
      if (match) {
        const [, filePath, lineNum, colNum, message] = match;
        const fullPath = path.resolve(projectRoot, filePath.trim());
        
        if (message.includes('Cannot find module') || message.includes('Module not found')) {
          const importMatch = message.match(/Cannot find module ['"]([^'"]+)['"]|Module ['"]([^'"]+)['"] not found/);
          if (importMatch) {
            const importPath = importMatch[1] || importMatch[2];
            const relPath = path.relative(projectRoot, fullPath);
            errors.push({
              file: relPath,
              line: parseInt(lineNum, 10),
              import: importPath,
              message,
              type: 'module_not_found',
            });
          }
        } else if (message.includes('has no exported member') || message.includes('does not provide an export')) {
          const exportMatch = message.match(/Module ['"]([^'"]+)['"] has no exported member ['"]([^'"]+)['"]|Module ['"]([^'"]+)['"] does not provide an export named ['"]([^'"]+)['"]/);
          if (exportMatch) {
            const modulePath = exportMatch[1] || exportMatch[3];
            const exportName = exportMatch[2] || exportMatch[4];
            const relPath = path.relative(projectRoot, fullPath);
            errors.push({
              file: relPath,
              line: parseInt(lineNum, 10),
              import: modulePath,
              export: exportName,
              message,
              type: 'export_not_found',
            });
          }
        } else if (message.includes('or its corresponding type declarations')) {
          const importMatch = message.match(/Cannot find module ['"]([^'"]+)['"]/);
          if (importMatch) {
            const importPath = importMatch[1];
            const relPath = path.relative(projectRoot, fullPath);
            errors.push({
              file: relPath,
              line: parseInt(lineNum, 10),
              import: importPath,
              message,
              type: 'module_not_found',
            });
          }
        }
      }
    }
  } catch (error) {
    if (error.status !== 0) {
      console.error(`⚠️  Could not run TypeScript compiler: ${error.message}`);
    }
  }
  return errors;
}

async function main() {
  console.log('🔍 Validating import paths and TypeScript errors...\n');
  
  const files = await glob('{app,scripts}/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/coverage/**', '**/*.spec.*', '**/*.test.*'],
  });
  
  console.log(`📁 Checking ${files.length} files...\n`);
  
  console.log('🔍 Checking TypeScript errors...\n');
  const tsErrors = getTypeScriptErrors(files);
  const filesWithTSErrors = new Set(tsErrors.map(e => e.file));
  
  const allErrors = [];
  
  for (const tsError of tsErrors) {
    const existing = allErrors.find(e => e.file === tsError.file);
    const errorEntry = {
      line: tsError.line,
      import: tsError.import || tsError.message,
      attempted: tsError.import || tsError.message,
      suggestions: [],
      source: 'typescript',
      type: tsError.type || 'unknown',
      export: tsError.export,
      message: tsError.message,
    };
    
    if (existing) {
      existing.errors.push(errorEntry);
    } else {
      allErrors.push({
        file: tsError.file,
        errors: [errorEntry],
      });
    }
  }
  
  console.log('🔍 Checking import paths...\n');
  for (const file of files) {
    const fileRel = path.relative(projectRoot, file);
    
    try {
      const errors = await validateImportsInFile(file);
      if (errors.length > 0) {
        allErrors.push({
          file: fileRel,
          errors,
        });
      }
    } catch (error) {
      console.error(`❌ Error checking ${fileRel}: ${error.message}`);
    }
  }
  
  if (allErrors.length === 0) {
    console.log('✅ All imports are valid!');
    return;
  }
  
  console.log(`\n❌ Found ${allErrors.length} files with invalid imports:\n`);
  
  for (const { file, errors } of allErrors) {
    console.log(`📄 ${file}`);
    for (const error of errors) {
      console.log(`   Line ${error.line}: ${error.import || error.message}`);
      if (error.type === 'export_not_found' && error.export) {
        console.log(`   ⚠️  Export '${error.export}' not found in module`);
      }
      if (error.attempted && error.attempted !== error.import) {
        console.log(`   ⚠️  Attempted: ${error.attempted}`);
      }
      if (error.message) {
        console.log(`   📝 ${error.message}`);
      }
      if (error.suggestions && error.suggestions.length > 0) {
        console.log(`   💡 Suggestions:`);
        for (const suggestion of error.suggestions) {
          console.log(`      - ${suggestion}`);
        }
      }
    }
    console.log('');
  }
  
  console.log(`\n✨ Total: ${allErrors.reduce((sum, f) => sum + f.errors.length, 0)} invalid imports`);
}

main().catch(console.error);
