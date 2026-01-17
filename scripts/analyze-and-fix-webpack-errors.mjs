import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const errors = new Map();

function findActualFile(missingPath) {
  const basePath = missingPath.replace(process.cwd() + '/', '');
  
  const possibleExtensions = ['', '.js', '.jsx', '.ts', '.tsx'];
  const possiblePaths = [
    basePath,
    basePath + '/index.js',
    basePath + '/index.ts',
    basePath + '/index.tsx',
    basePath + '/index.jsx',
  ];
  
  for (const ext of possibleExtensions) {
    for (const path of possiblePaths) {
      const fullPath = path + ext;
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  
  const parts = basePath.split('/');
  const fileName = parts[parts.length - 1];
  const dir = parts.slice(0, -1).join('/');
  
  const searchPatterns = [
    `${dir}/**/${fileName}.*`,
    `**/${fileName}.*`,
  ];
  
  for (const pattern of searchPatterns) {
    try {
      const matches = glob.sync(pattern, { ignore: ['**/node_modules/**'] });
      if (matches.length > 0) {
        return matches[0];
      }
    } catch (e) {
      // continue
    }
  }
  
  return null;
}

function extractWebpackErrors() {
  try {
    const output = execSync('timeout 30 yarn hot 2>&1 || true', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const lines = output.split('\n');
    
    let currentFile = null;
    
    for (const line of lines) {
      const fileMatch = line.match(/ERROR in (\.\/[^\s]+)/);
      if (fileMatch) {
        currentFile = fileMatch[1].replace(/^\.\//, 'app/');
      }
      
      const moduleMatch = line.match(/Can't resolve '([^']+)'/);
      if (moduleMatch && currentFile) {
        const missingModule = moduleMatch[1].replace(process.cwd() + '/', '');
        if (!errors.has(currentFile)) {
          errors.set(currentFile, []);
        }
        errors.get(currentFile).push(missingModule);
      }
      
      const exportMatch = line.match(/export '([^']+)'.*was not found in '([^']+)'/);
      if (exportMatch && currentFile) {
        const missingExport = exportMatch[1];
        const sourceFile = exportMatch[2].replace(process.cwd() + '/', '').replace(/^#app\//, 'app/react/').replace(/^#api\//, 'app/api/');
        if (!errors.has(currentFile)) {
          errors.set(currentFile, []);
        }
        errors.get(currentFile).push({ type: 'export', name: missingExport, source: sourceFile });
      }
    }
  } catch (error) {
    console.log('Note: Could not run yarn hot');
  }
}

async function analyzeAndFix() {
  console.log('🔍 Extracting webpack errors...\n');
  extractWebpackErrors();
  
  console.log(`Found ${errors.size} files with errors\n`);
  
  const replacements = new Map();
  
  for (const [filePath, missingModules] of errors.entries()) {
    if (!existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }
    
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (const missing of missingModules) {
      if (typeof missing === 'string') {
        const actualFile = findActualFile(missing);
        if (actualFile) {
          const importPath = actualFile.replace(/^app\//, '#app/').replace(/^app\/api\//, '#api/');
          const ext = actualFile.match(/\.(js|jsx|ts|tsx)$/)?.[0] || '.js';
          const correctPath = importPath.replace(/\.(js|jsx|ts|tsx)$/, ext);
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(missing.split('/').pop()) && (line.includes('import') || line.includes('from'))) {
              const pattern = new RegExp(`(['"])${missing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g');
              if (pattern.test(line)) {
                const key = `${missing} -> ${correctPath}`;
                if (!replacements.has(key)) {
                  replacements.set(key, { from: missing, to: correctPath });
                }
                console.log(`📄 ${filePath}:${i + 1}`);
                console.log(`   ${line.trim()}`);
                console.log(`   → Should be: ${correctPath}\n`);
              }
            }
          }
        } else {
          console.log(`❌ Could not find: ${missing}`);
        }
      }
    }
  }
  
  console.log(`\n✨ Found ${replacements.size} unique import patterns to fix\n`);
  
  return Array.from(replacements.values());
}

const fixes = await analyzeAndFix();
console.log('Replacement patterns:');
fixes.forEach(({ from, to }) => {
  console.log(`  ${from} → ${to}`);
});
