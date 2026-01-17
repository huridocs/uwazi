import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { execSync } from 'child_process';

console.log('🔍 Analyzing webpack errors...\n');

const errorPatterns = [
  /Module not found: Error: Can't resolve '([^']+)' in '([^']+)'/g,
  /export '([^']+)' \(.*\) was not found in '([^']+)'/g,
];

const filesToCheck = new Set();
const importErrors = new Map();

async function analyzeErrors() {
  try {
    const output = execSync('timeout 30 yarn hot 2>&1 || true', { encoding: 'utf-8', cwd: process.cwd() });
    const lines = output.split('\n');
    
    for (const line of lines) {
      for (const pattern of errorPatterns) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
          if (match[2]) {
            const filePath = match[2].replace(process.cwd() + '/', '');
            filesToCheck.add(filePath);
            
            const missingModule = match[1];
            if (!importErrors.has(filePath)) {
              importErrors.set(filePath, []);
            }
            importErrors.get(filePath).push(missingModule);
          }
        }
      }
    }
  } catch (error) {
    console.log('Note: Could not run yarn hot, will analyze files directly');
  }
  
  console.log(`Found ${filesToCheck.size} files with errors\n`);
  
  for (const filePath of filesToCheck) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const missingModules = importErrors.get(filePath) || [];
      
      for (const missingModule of missingModules) {
        console.log(`📄 ${filePath}`);
        console.log(`   Missing: ${missingModule}`);
        
        const importLines = content.split('\n').map((line, idx) => ({ line, idx: idx + 1 }))
          .filter(({ line }) => line.includes(missingModule) || line.includes(missingModule.split('/').pop()));
        
        for (const { line, idx } of importLines) {
          console.log(`   Line ${idx}: ${line.trim()}`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`⚠️  Could not read ${filePath}: ${error.message}`);
    }
  }
}

analyzeErrors();
