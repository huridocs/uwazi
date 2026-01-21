import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = await glob('app/**/*.{js,jsx,ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**'],
});

const immutableMethods = ['Map', 'List', 'Set', 'fromJS', 'is', 'OrderedMap', 'OrderedSet', 'Seq'];

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  const originalContent = content;
  
  if (!content.includes('const {') || !content.includes('Immutable')) {
    continue;
  }
  
  const immutableDestructurePattern = /const\s+\{([^}]+)\}\s*=\s*(Immutable(?:Lib)?);?/g;
  let match;
  const replacements = new Map();
  
  while ((match = immutableDestructurePattern.exec(content)) !== null) {
    const destructured = match[1].trim();
    const items = destructured.split(',').map(item => item.trim());
    
    for (const item of items) {
      const aliasMatch = item.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
      if (aliasMatch) {
        const [, original, alias] = aliasMatch;
        const varName = alias || original;
        if (immutableMethods.includes(original)) {
          replacements.set(varName, original);
        }
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
  
  if (modified && content !== originalContent) {
    const cleanedContent = content.replace(/\n{3,}/g, '\n\n');
    writeFileSync(file, cleanedContent, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${totalFixed} files`);
