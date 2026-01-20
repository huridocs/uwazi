#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...findFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixImmutableImports(content) {
  let newContent = content;
  let fixed = false;

  const defaultWithNamedPattern = /import\s+(\w+)\s*,\s*{([^}]+)}\s+from\s+['"]immutable['"];?/g;
  const defaultMatches = [...content.matchAll(defaultWithNamedPattern)];

  if (defaultMatches.length > 0) {
    defaultMatches.forEach(match => {
      const defaultName = match[1];
      const namedList = match[2].trim();
      const items = namedList.split(',').map(item => item.trim());
      
      const destructured = items.map(item => {
        const aliasMatch = item.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
        if (aliasMatch) {
          const [, original, alias] = aliasMatch;
          return `${original}${original !== alias ? ` as ${alias}` : ''}`;
        }
        return item;
      });

      const destructureLine = `const { ${destructured.join(', ')} } = ${defaultName};`;
      
      newContent = newContent.replace(match[0], `import ${defaultName} from 'immutable';\n\n${destructureLine}`);
      fixed = true;
    });
  }

  const namedImportPattern = /import\s+{([^}]+)}\s+from\s+['"]immutable['"];?/g;
  const matches = [...newContent.matchAll(namedImportPattern)];

  if (matches.length > 0) {
    const destructured = [];

    matches.forEach(match => {
      const importList = match[1].trim();
      const items = importList.split(',').map(item => {
        const trimmed = item.trim();
        const aliasMatch = trimmed.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
        if (aliasMatch) {
          const [, original, alias] = aliasMatch;
          return { original, alias: alias || original };
        }
        return { original: trimmed, alias: trimmed };
      });

      items.forEach(({ original, alias }) => {
        if (original !== 'default') {
          destructured.push(`${original}${original !== alias ? ` as ${alias}` : ''}`);
        }
      });
    });

    if (destructured.length > 0) {
      const destructureLine = `const { ${destructured.join(', ')} } = Immutable;`;
      
      newContent = newContent.replace(namedImportPattern, (match, offset) => {
        fixed = true;
        const beforeMatch = newContent.slice(0, offset);
        const afterMatch = newContent.slice(offset + match.length);
        
        const lastImportIndex = beforeMatch.lastIndexOf("import");
        const lastImportLineEnd = beforeMatch.indexOf('\n', lastImportIndex);
        
        if (lastImportLineEnd !== -1) {
          return `import Immutable from 'immutable';\n\n${destructureLine}`;
        }
        return `import Immutable from 'immutable';\n\n${destructureLine}`;
      });
    }
  }

  const typoPattern = /import\s+Immuable\s+from\s+['"]immutable['"];?/gi;
  if (typoPattern.test(newContent)) {
    newContent = newContent.replace(typoPattern, "import Immutable from 'immutable';");
    fixed = true;
  }

  return { content: newContent, fixed };
}

const appDir = join(process.cwd(), 'app');
const files = findFiles(appDir);
const fixedFiles = [];

console.log(`🔍 Scanning ${files.length} files for immutable imports...\n`);

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8');
    if (content.includes("from 'immutable'") || content.includes('from "immutable"')) {
      const { content: newContent, fixed } = fixImmutableImports(content);
      if (fixed) {
        writeFileSync(file, newContent, 'utf-8');
        fixedFiles.push(file);
      }
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

if (fixedFiles.length === 0) {
  console.log('✅ No files needed fixing!');
  process.exit(0);
}

console.log(`✅ Fixed ${fixedFiles.length} files:\n`);
fixedFiles.forEach(file => {
  const relativePath = file.replace(process.cwd() + '/', '');
  console.log(`  ✓ ${relativePath}`);
});

console.log(`\n📊 Summary: Fixed ${fixedFiles.length} files`);
process.exit(0);
