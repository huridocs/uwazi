import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = await glob('app/**/*.{js,jsx,ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  const originalContent = content;
  
  const immutableDestructurePattern = /const\s+\{([^}]+)\}\s*=\s*Immutable(?:Lib)?;?/g;
  const immutableMatches = [...content.matchAll(immutableDestructurePattern)];
  
  if (immutableMatches.length > 0) {
    const replacements = new Map();
    
    for (const match of immutableMatches) {
      const destructured = match[1].trim();
      const items = destructured.split(',').map(item => item.trim());
      
      for (const item of items) {
        const aliasMatch = item.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
        if (aliasMatch) {
          const [, original, alias] = aliasMatch;
          const varName = alias || original;
          replacements.set(varName, original);
        }
      }
    }
    
    if (replacements.size > 0) {
      for (const [varName, immutableMethod] of replacements.entries()) {
        const varPattern = new RegExp(`\\b${varName}\\b`, 'g');
        content = content.replace(varPattern, `Immutable.${immutableMethod}`);
      }
      
      content = content.replace(immutableDestructurePattern, '');
      modified = true;
    }
  }
  
  const lodashDestructurePattern = /import\s+\{([^}]+)\}\s+from\s+['"]lodash['"];?/g;
  const lodashMatches = [...content.matchAll(lodashDestructurePattern)];
  
  if (lodashMatches.length > 0) {
    for (const match of lodashMatches) {
      const imports = match[1].trim();
      const items = imports.split(',').map(item => item.trim());
      
      const importStatements = [];
      const replacements = new Map();
      
      for (const item of items) {
        const aliasMatch = item.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
        if (aliasMatch) {
          const [, original, alias] = aliasMatch;
          const varName = alias || original;
          importStatements.push(`import ${varName} from 'lodash/${original}.js';`);
          replacements.set(varName, original);
        }
      }
      
      if (importStatements.length > 0) {
        content = content.replace(match[0], importStatements.join('\n'));
        modified = true;
      }
    }
  }
  
  if (modified && content !== originalContent) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${totalFixed} files`);
