import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function findActualFile(targetPath, baseDir) {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  for (const ext of extensions) {
    const fullPath = targetPath + ext;
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return { path: fullPath, extension: ext };
    }
  }
  
  const indexExtensions = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  for (const ext of indexExtensions) {
    const fullPath = path.join(targetPath, ext);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return { path: fullPath, extension: ext, isIndex: true };
    }
  }
  
  return null;
}

function resolveImportPath(filePath, importPath) {
  const fileDir = path.dirname(filePath);
  const targetPath = path.resolve(fileDir, importPath);
  
  const actualFile = findActualFile(targetPath, fileDir);
  if (actualFile) {
    let relPath = path.relative(fileDir, actualFile.path);
    relPath = relPath.replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = `./${relPath}`;
    
    if (actualFile.isIndex) {
      relPath = relPath.replace(/\/index\.(ts|tsx|js|jsx)$/, '/index.js');
    } else {
      relPath = relPath.replace(/\.(ts|tsx)$/, '.js');
    }
    
    return relPath;
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
  
  const relativeImportRegex = /from\s+(['"])(\.\.?\/[^'"]+?)(['"])/g;
  const matches = [...content.matchAll(relativeImportRegex)];
  
  for (const match of matches) {
    const fullMatch = match[0];
    const quote = match[1];
    const importPath = match[2];
    const endQuote = match[3];
    
    if (importPath.match(/\.(js|jsx|ts|tsx|mjs|cjs)$/)) {
      continue;
    }
    
    const resolved = resolveImportPath(path.join(projectRoot, file), importPath);
    if (resolved && resolved !== importPath) {
      const newImport = `from ${quote}${resolved}${endQuote}`;
      content = content.replace(fullMatch, newImport);
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
  }
}

console.log(`✨ Fixed ${totalFixed} files`);
