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
  
  const immutableDestructurePattern = /const\s+\{([^}]+)\}\s*=\s*(Immutable(?:Lib)?);?/g;
  const matches = [...content.matchAll(immutableDestructurePattern)];
  
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
        const varPatternCall = new RegExp(`\\b${varName}\\s*\\(`, 'g');
        content = content.replace(varPatternCall, `Immutable.${immutableMethod}(`);
        
        const varPattern = new RegExp(`\\b${varName}\\b(?!\\.)`, 'g');
        content = content.replace(varPattern, `Immutable.${immutableMethod}`);
      }
      
      content = content.replace(immutableDestructurePattern, '');
      
      const immutableLibPattern = /import\s+ImmutableLib\s+from\s+['"]immutable['"];?/g;
      if (immutableLibPattern.test(content)) {
        content = content.replace(immutableLibPattern, "import Immutable from 'immutable';");
      }
      
      modified = true;
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
