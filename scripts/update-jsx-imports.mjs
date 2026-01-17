import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

const convertedFiles = await glob('app/react/**/*.tsx', {
  ignore: ['**/node_modules/**', '**/specs/**', '**/*.spec.*'],
});

const fileMap = new Map();
for (const file of convertedFiles) {
  const baseName = file.replace(/\.tsx$/, '');
  const oldName = baseName + '.js';
  fileMap.set(oldName, file);
}

const filesToUpdate = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**'],
});

let totalUpdated = 0;

for (const file of filesToUpdate) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  for (const [oldPath, newPath] of fileMap.entries()) {
    const patterns = [
      new RegExp(`from\\s+['"](#app/[^'"]*?)${oldPath.replace(/^app\/react\//, '')}['"]`, 'g'),
      new RegExp(`from\\s+['"](#app/[^'"]*?)${oldPath.replace(/^app\/react\//, '').replace(/\.js$/, '')}['"]`, 'g'),
      new RegExp(`import\\s+.*from\\s+['"](#app/[^'"]*?)${oldPath.replace(/^app\/react\//, '')}['"]`, 'g'),
      new RegExp(`import\\s+.*from\\s+['"](#app/[^'"]*?)${oldPath.replace(/^app\/react\//, '').replace(/\.js$/, '')}['"]`, 'g'),
    ];
    
    const newImportPath = newPath.replace(/^app\/react\//, '#app/').replace(/\.tsx$/, '.tsx');
    
    for (const pattern of patterns) {
      const newContent = content.replace(pattern, (match, prefix) => {
        return match.replace(oldPath.replace(/^app\/react\//, ''), newPath.replace(/^app\/react\//, '').replace(/\.tsx$/, '.tsx'));
      });
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    const simplePattern = new RegExp(`(['"]#app/[^'"]*?)${oldPath.replace(/^app\/react\//, '').replace(/\.js$/, '')}(['"])`, 'g');
    const newContent = content.replace(simplePattern, `$1${newPath.replace(/^app\/react\//, '').replace(/\.tsx$/, '.tsx')}$2`);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalUpdated++;
    console.log(`✅ Updated imports in: ${file}`);
  }
}

console.log(`\n✨ Updated ${totalUpdated} files`);
