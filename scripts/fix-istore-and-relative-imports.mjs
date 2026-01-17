import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const replacements = [
  {
    from: /from\s+(['"])#app\/istore\.ts(['"])/g,
    to: `from $1#app/istore.js$2`,
  },
  {
    from: /import\s+.*?from\s+(['"])#app\/istore\.ts(['"])/g,
    to: (match) => match.replace(/istore\.ts/, 'istore.js'),
  },
  {
    from: /from\s+(['"])\.\.\/actions\/actions(['"])/g,
    to: `from $1../actions/actions.js$2`,
  },
  {
    from: /from\s+(['"])\.\/AttachmentsModal(['"])/g,
    to: `from $1./AttachmentsModal.jsx$2`,
  },
];

const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  for (const { from, to } of replacements) {
    const newContent = typeof to === 'function' 
      ? content.replace(from, to)
      : content.replace(from, to);
    
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
  }
}

console.log(`✨ Fixed ${totalFixed} files`);
