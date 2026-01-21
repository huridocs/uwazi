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
  
  const immutableDestructurePatterns = [
    /const\s+\{([^}]+)\}\s*=\s*Immutable(?:Lib)?;?/g,
    /const\s+\{([^}]+)\}\s*=\s*ImmutableLib;?/g,
  ];
  
  for (const pattern of immutableDestructurePatterns) {
    const matches = [...content.matchAll(pattern)];
    
    if (matches.length > 0) {
      const replacements = new Map();
      
      for (const match of matches) {
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
          const varPattern = new RegExp(`\\b${varName}\\b(?!\\.)`, 'g');
          content = content.replace(varPattern, `Immutable.${immutableMethod}`);
        }
        
        content = content.replace(pattern, '');
        modified = true;
      }
    }
  }
  
  if (modified && content !== originalContent) {
    const cleanedContent = content.replace(/\n{3,}/g, '\n\n');
    writeFileSync(file, cleanedContent, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${totalFixed} files`);
