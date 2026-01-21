import { readFileSync, writeFileSync, existsSync } from 'fs';

const deletedFiles = readFileSync('scripts/duplicate-ts-files-to-delete.txt', 'utf-8')
  .trim()
  .split('\n')
  .filter(Boolean);

const filesToCheck = [];
for (const tsFile of deletedFiles) {
  const base = tsFile.replace(/\.(ts|tsx)$/, '');
  const jsFile = base + '.js';
  const jsxFile = base + '.jsx';
  
  if (existsSync(jsFile)) {
    filesToCheck.push(jsFile);
  } else if (existsSync(jsxFile)) {
    filesToCheck.push(jsxFile);
  }
}

let fixed = 0;
for (const file of filesToCheck) {
  let content = readFileSync(file, 'utf-8');
  const original = content;
  
  content = content.replace(/from ['"]#UI\/Icon\/Icon\.jsx['"]/g, "from '#UI/Icon/Icon.js'");
  content = content.replace(/from ["']#UI\/Icon\/Icon\.jsx["']/g, '"#UI/Icon/Icon.js"');
  
  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    fixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${fixed} files`);
