#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
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
    const rest = importPath.slice(5);
    const reactPath = path.join(projectRoot, 'app', 'react', rest);
    const appPath = path.join(projectRoot, 'app', rest);
    if (existsSync(appPath) || findActualFile(appPath)) {
      return appPath;
    }
    return reactPath;
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
    };
  }
  
  return { valid: false, reason: 'unresolved' };
}

async function findBestSuggestion(importPath, fromFile) {
  const fromDir = path.dirname(fromFile);
  
  if (importPath.startsWith('#app/')) {
    const rest = importPath.slice(5);
    const parts = rest.split('/');
    const fileName = parts[parts.length - 1]?.replace(/\.(js|ts|tsx|jsx)$/, '') || '';
    
    if (!fileName) return null;
    
    try {
      const searchDirs = [
        path.join(projectRoot, 'app'),
        path.join(projectRoot, 'app', 'react'),
      ];
      
      for (const searchDir of searchDirs) {
        const matches = await glob(`**/${fileName}*.{js,ts,tsx,jsx}`, {
          cwd: searchDir,
          absolute: true,
          ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*', '**/*.test.*'],
        });
        
        for (const match of matches) {
          const relPath = path.relative(fromDir, match);
          let relImport = './' + relPath.replace(/\\/g, '/');
          relImport = relImport.replace(/\.(ts|tsx)$/, '.js');
          
          const found = findActualFile(match);
          if (found) {
            return relImport;
          }
        }
        
        for (const match of matches.slice(0, 1)) {
          const matchRel = path.relative(projectRoot, match);
          if (matchRel.startsWith('app/')) {
            let importMapPath = '#app/' + matchRel.slice(4).replace(/\\/g, '/');
            importMapPath = importMapPath.replace(/\.(ts|tsx)$/, '.js');
            const found = findActualFile(match);
            if (found) {
              return importMapPath;
            }
          }
        }
      }
    } catch (e) {}
  }
  
  if (importPath.startsWith('#shared/')) {
    const rest = importPath.slice(8);
    const parts = rest.split('/');
    const fileName = parts[parts.length - 1]?.replace(/\.(js|ts|tsx|jsx)$/, '') || '';
    
    if (!fileName) return null;
    
    try {
      const searchDirs = [
        path.join(projectRoot, 'app', 'shared'),
        path.join(projectRoot, 'app', 'react', 'V2', 'shared'),
      ];
      
      for (const searchDir of searchDirs) {
        if (!existsSync(searchDir)) continue;
        
        const matches = await glob(`**/${fileName}*.{js,ts,tsx,jsx}`, {
          cwd: searchDir,
          absolute: true,
          ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
        });
        
        for (const match of matches) {
          const matchRel = path.relative(projectRoot, match);
          if (matchRel.startsWith('app/react/V2/shared/')) {
            let importMapPath = '#V2/shared/' + matchRel.slice(19).replace(/\\/g, '/').replace(/\.(ts|tsx)$/, '.js');
            importMapPath = importMapPath.replace(/\/\//g, '/');
            const found = findActualFile(match);
            if (found) {
              return importMapPath;
            }
          }
          
          const relPath = path.relative(fromDir, match);
          const relImport = './' + relPath.replace(/\\/g, '/').replace(/\.(ts|tsx)$/, '.js');
          
          const found = findActualFile(match);
          if (found) {
            return relImport;
          }
        }
      }
    } catch (e) {}
  }
  
  if (importPath.startsWith('#api/')) {
    const rest = importPath.slice(5);
    const parts = rest.split('/');
    const fileName = parts[parts.length - 1]?.replace(/\.(js|ts|tsx|jsx)$/, '') || '';
    
    if (!fileName) return null;
    
    try {
      const matches = await glob(`**/${fileName}*.{js,ts,tsx,jsx}`, {
        cwd: path.join(projectRoot, 'app', 'api'),
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
      });
      
      for (const match of matches) {
        const matchRel = path.relative(projectRoot, match);
        if (matchRel.startsWith('app/api/')) {
          const importMapPath = '#api/' + matchRel.slice(8).replace(/\\/g, '/').replace(/\.(ts|tsx)$/, '.js');
          const found = findActualFile(match);
          if (found) {
            return importMapPath;
          }
        }
      }
    } catch (e) {}
  }
  
  return null;
}

async function fixImportsInFile(filePath, debug = false) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;
  
  const patterns = [
    /from\s+(['"])([^'"]+)(['"])/g,
    /import\s+.*from\s+(['"])([^'"]+)(['"])/g,
    /export\s+.*from\s+(['"])([^'"]+)(['"])/g,
  ];
  
  const replacements = new Map();
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(newContent)) !== null) {
      const quote1 = match[1];
      const importPath = match[2];
      const quote2 = match[3];
      const fullMatch = match[0];
      
      if (importPath.startsWith('http://') || importPath.startsWith('https://') || 
          importPath.startsWith('data:') || importPath.startsWith('node:')) {
        continue;
      }
      
      if (replacements.has(fullMatch)) {
        continue;
      }
      
      const result = resolveImport(importPath, filePath);
      
      if (debug && (path.basename(filePath) === 'PDFView.tsx' || path.basename(filePath) === 'PropertySidepanel.tsx')) {
        console.log(`  Checking: ${importPath} -> valid: ${result.valid}`);
      }
      
      if (!result.valid) {
        let suggestion = await findBestSuggestion(importPath, filePath);
        
        if (!suggestion && importPath.startsWith('../')) {
          const fromDir = path.dirname(filePath);
          const resolved = path.resolve(fromDir, importPath);
          const fileName = path.basename(resolved, path.extname(resolved));
          const parentDir = path.dirname(fromDir);
          
          const possibleFiles = [
            path.join(fromDir, fileName),
            path.join(parentDir, fileName),
            path.join(fromDir, path.basename(importPath)),
            path.join(parentDir, path.basename(importPath)),
          ];
          
          for (const possible of possibleFiles) {
            const found = findActualFile(possible);
            if (found) {
              const relPath = path.relative(fromDir, found);
              suggestion = './' + relPath.replace(/\\/g, '/').replace(/\.(ts|tsx)$/, '.js');
              break;
            }
          }
        }
        
        if (debug && (path.basename(filePath) === 'PDFView.tsx' || path.basename(filePath) === 'PropertySidepanel.tsx')) {
          console.log(`  Suggestion for ${importPath}: ${suggestion}`);
        }
        if (suggestion) {
          const newImport = fullMatch.replace(importPath, suggestion);
          replacements.set(fullMatch, {
            from: fullMatch,
            to: newImport,
            original: importPath,
            fixed: suggestion,
          });
        }
      }
    }
  }
  
  if (replacements.size > 0) {
    const sortedReplacements = Array.from(replacements.values()).reverse();
    for (const replacement of sortedReplacements) {
      newContent = newContent.replace(replacement.from, replacement.to);
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    return { fixed: true, replacements: Array.from(replacements.values()) };
  }
  
  return { fixed: false, replacements: [] };
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
  const dryRun = process.argv.includes('--dry-run');
  const debug = process.argv.includes('--debug');
  
  console.log('🔍 Finding and fixing invalid imports using TypeScript compiler...\n');
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  if (debug) {
    console.log('🐛 DEBUG MODE - Extra logging enabled\n');
  }
  
  const files = await glob('{app,scripts}/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/coverage/**', '**/*.spec.*', '**/*.test.*'],
  });
  
  console.log(`📁 Checking ${files.length} files with TypeScript compiler...\n`);
  
  const tsErrors = getTypeScriptErrors(files);
  const filesWithTSErrors = new Map();
  
  for (const tsError of tsErrors) {
    if (!filesWithTSErrors.has(tsError.file)) {
      filesWithTSErrors.set(tsError.file, []);
    }
    filesWithTSErrors.get(tsError.file).push(tsError.import);
  }
  
  console.log(`📁 Found ${filesWithTSErrors.size} files with import errors from TypeScript\n`);
  
  let fixedCount = 0;
  const allReplacements = [];
  
  for (const [fileRel, imports] of filesWithTSErrors.entries()) {
    const file = path.join(projectRoot, fileRel);
    try {
      const result = await fixImportsInFile(file, debug);
      if (result.fixed) {
        fixedCount++;
        allReplacements.push({ file: fileRel, replacements: result.replacements });
        
        if (!dryRun) {
          console.log(`✅ Fixed: ${fileRel}`);
          for (const rep of result.replacements) {
            console.log(`   ${rep.original} → ${rep.fixed}`);
          }
        } else {
          console.log(`📝 Would fix: ${fileRel}`);
          for (const rep of result.replacements) {
            console.log(`   ${rep.original} → ${rep.fixed}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error checking ${fileRel}: ${error.message}`);
      if (debug) {
        console.error(error.stack);
      }
    }
  }
  
  for (const file of files) {
    const fileRel = path.relative(projectRoot, file);
    if (filesWithTSErrors.has(fileRel)) continue;
    
    try {
      const result = await fixImportsInFile(file, debug);
      if (result.fixed) {
        fixedCount++;
        allReplacements.push({ file: fileRel, replacements: result.replacements });
        
        if (!dryRun) {
          console.log(`✅ Fixed: ${fileRel}`);
          for (const rep of result.replacements) {
            console.log(`   ${rep.original} → ${rep.fixed}`);
          }
        } else {
          console.log(`📝 Would fix: ${fileRel}`);
          for (const rep of result.replacements) {
            console.log(`   ${rep.original} → ${rep.fixed}`);
          }
        }
      }
    } catch (error) {
      if (debug) {
        console.error(`❌ Error checking ${fileRel}: ${error.message}`);
      }
    }
  }
  
  if (dryRun) {
    console.log(`\n✨ Would fix ${fixedCount} files`);
    console.log(`\n💡 Run without --dry-run to apply fixes`);
  } else {
    console.log(`\n✨ Fixed ${fixedCount} files`);
  }
  
  const totalReplacements = allReplacements.reduce((sum, f) => sum + f.replacements.length, 0);
  console.log(`📊 Total imports fixed: ${totalReplacements}`);
}

main().catch(console.error);
