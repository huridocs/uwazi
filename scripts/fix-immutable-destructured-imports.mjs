import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = await glob('app/react/**/*.{js,jsx,ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  const originalContent = content;
  
  const namedImportPattern = /import\s+{([^}]+)}\s+from\s+['"]immutable['"];?/g;
  const matches = [...content.matchAll(namedImportPattern)];
  
  if (matches.length > 0) {
    const imports = [];
    const destructured = [];
    
    for (const match of matches) {
      const importList = match[1].trim();
      const items = importList.split(',').map(item => item.trim());
      
      for (const item of items) {
        const aliasMatch = item.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
        if (aliasMatch) {
          const [, original, alias] = aliasMatch;
          const finalName = alias || original;
          imports.push(original);
          destructured.push(`${original}${original !== finalName ? ` as ${finalName}` : ''}`);
        } else {
          imports.push(item);
          destructured.push(item);
        }
      }
    }
    
    if (destructured.length > 0) {
      const destructureLine = `const { ${destructured.join(', ')} } = Immutable;`;
      
      content = content.replace(namedImportPattern, (match) => {
        const existingImmutableImport = /import\s+Immutable\s+from\s+['"]immutable['"];?/;
        if (existingImmutableImport.test(content)) {
          return '';
        }
        return `import Immutable from 'immutable';`;
      });
      
      const firstImportMatch = content.match(/^import\s+.*?from\s+['"][^'"]+['"];?\n/m);
      if (firstImportMatch) {
        const insertIndex = firstImportMatch.index + firstImportMatch[0].length;
        content = content.slice(0, insertIndex) + '\n' + destructureLine + '\n' + content.slice(insertIndex);
      } else {
        content = `import Immutable from 'immutable';\n\n${destructureLine}\n${content}`;
      }
      
      modified = true;
    }
  }
  
  const defaultWithNamedPattern = /import\s+(\w+)\s*,\s*{([^}]+)}\s+from\s+['"]immutable['"];?/g;
  const defaultMatches = [...content.matchAll(defaultWithNamedPattern)];
  
  if (defaultMatches.length > 0) {
    for (const match of defaultMatches) {
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
      content = content.replace(match[0], `import ${defaultName} from 'immutable';\n\n${destructureLine}`);
      modified = true;
    }
  }
  
  if (modified && content !== originalContent) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${totalFixed} files`);
