import { readFileSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const excludedFiles = [
  'app/react/App/RouteHandler.tsx',
  'app/react/I18N/components/I18N.tsx',
];

const addedFiles = execSync(
  "git diff --name-status production...cjs-esm | grep -E '^A.*app/(react|api).*\\.(ts|tsx)$' | awk '{print $2}'",
  { encoding: 'utf-8' }
)
  .trim()
  .split('\n')
  .filter(Boolean);

const duplicates = [];

for (const file of addedFiles) {
  if (excludedFiles.includes(file)) {
    continue;
  }
  
  const base = file.replace(/\.(ts|tsx)$/, '');
  const jsFile = base + '.js';
  const jsxFile = base + '.jsx';
  
  if (existsSync(jsFile) || existsSync(jsxFile)) {
    duplicates.push(file);
  }
}

console.log(`Found ${duplicates.length} duplicate .ts/.tsx files to delete:\n`);
duplicates.forEach(f => console.log(f));

const outputFile = 'scripts/duplicate-ts-files-to-delete.txt';
writeFileSync(outputFile, duplicates.join('\n') + '\n');
console.log(`\nList written to ${outputFile}`);
