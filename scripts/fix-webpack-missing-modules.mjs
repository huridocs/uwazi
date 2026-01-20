import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const mappings = {
  '#shared/errorUtils.js': '#app/V2/shared/errorUtils.js',
  '#shared/formatHelpers.js': '#shared/formatHelpers.ts',
  '#shared/dateHelpers.js': '#shared/dateHelpers.ts',
  '#shared/ParagraphExtractionTypes.js': '#shared/ParagraphExtractionTypes.ts',
  '#app/files/index.js': '#app/files/index.ts',
  '#app/preserve/index.js': '#app/preserve/index.ts',
  '#app/thesauri/index.js': '#app/thesauri/index.ts',
  '#app/Settings.js': '#app/Settings.tsx',
  '#app/V2/Components/CodeEditor.js': '#app/V2/Components/CodeEditor.tsx',
  '#app/V2/api/settings.js': '#app/V2/api/settings/index.ts',
  '#app/V2/api/Users/UsersAPI.js': '#app/V2/api/users/UsersAPI.ts',
  '#app/utils/generateTableHeader.js': '#app/utils/generateTableHeader.ts',
  '#app/utils/formatters.js': '#app/utils/formatters.ts',
  '#app/utils/filterPXQualifiedTemplates.js': '#app/utils/filterPXQualifiedTemplates.ts',
  '#app/utils/generateDisplayPill': '#app/utils/generateDisplayPill.ts',
};

function findActualFile(importPath) {
  if (importPath.startsWith('#app/')) {
    const relPath = importPath.slice(5).replace(/\.js$/, '');
    const baseDir = path.join(projectRoot, 'app/react');
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    for (const ext of extensions) {
      const fullPath = path.join(baseDir, relPath + ext);
      if (existsSync(fullPath)) return `#app/${relPath}${ext === '.ts' || ext === '.tsx' ? '.js' : ext}`;
      const indexPath = path.join(baseDir, relPath, `index${ext}`);
      if (existsSync(indexPath)) return `#app/${relPath}/index${ext === '.ts' || ext === '.tsx' ? '.js' : ext}`;
    }
  } else if (importPath.startsWith('#shared/')) {
    const relPath = importPath.slice(8).replace(/\.js$/, '');
    const baseDir = path.join(projectRoot, 'app/shared');
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    for (const ext of extensions) {
      const fullPath = path.join(baseDir, relPath + ext);
      if (existsSync(fullPath)) return `#shared/${relPath}${ext === '.ts' || ext === '.tsx' ? '.js' : ext}`;
    }
  }
  return null;
}

const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*', '**/prod/**'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  for (const [wrong, correct] of Object.entries(mappings)) {
    const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(wrong)) {
      content = content.replace(regex, correct);
      modified = true;
    }
  }
  
  const importRegex = /from\s+(['"])(#[^'"]+)(['"])/g;
  const matches = [...content.matchAll(importRegex)];
  
  for (const match of matches) {
    const importPath = match[2];
    if (mappings[importPath]) continue;
    
    const actual = findActualFile(importPath);
    if (actual && actual !== importPath) {
      content = content.replace(match[0], `from ${match[1]}${actual}${match[3]}`);
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
  }
}

console.log(`✨ Fixed ${totalFixed} files`);
