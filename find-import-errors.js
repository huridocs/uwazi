import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🔍 Finding import errors by running the application...');

const child = spawn('yarn', ['dev-server'], {
  cwd: process.cwd(),
  env: { ...process.env, FEATURE_FLAG_PARAGRAPH_EXTRACTION: 'true', EXTERNAL_SERVICES: 'true' },
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

child.on('close', (code) => {
  console.log('Application exited with code:', code);
  
  // Extract import errors from the output
  const importErrors = [];
  const lines = (output + errorOutput).split('\n');
  
  for (const line of lines) {
    if (line.includes('ERR_MODULE_NOT_FOUND') && line.includes('imported from')) {
      const match = line.match(/Cannot find module '([^']+)' imported from ([^\s]+)/);
      if (match) {
        const [, missingModule, importingFile] = match;
        importErrors.push({
          missingModule,
          importingFile: importingFile.replace('file://', ''),
          error: line.trim()
        });
      }
    }
  }
  
  console.log(`\n🎯 Found ${importErrors.length} import errors:`);
  
  // Group errors by importing file
  const errorsByFile = {};
  for (const error of importErrors) {
    if (!errorsByFile[error.importingFile]) {
      errorsByFile[error.importingFile] = [];
    }
    errorsByFile[error.importingFile].push(error);
  }
  
  // Output summary
  for (const [file, errors] of Object.entries(errorsByFile)) {
    console.log(`\n📁 ${file}:`);
    for (const error of errors) {
      console.log(`  ❌ Missing: ${error.missingModule}`);
    }
  }
  
  // Save detailed report
  writeFileSync('import-errors-report.json', JSON.stringify(importErrors, null, 2));
  console.log(`\n📄 Detailed report saved to: import-errors-report.json`);
});

// Kill the process after 30 seconds
setTimeout(() => {
  child.kill();
  console.log('\n⏰ Timeout reached, stopping...');
}, 30000);
