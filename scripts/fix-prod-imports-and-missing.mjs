import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const replacements = [
  {
    from: /from\s+(['"])prod\/app\/react\/([^'"]+)(['"])/g,
    to: (match, quote1, path, quote2) => {
      const ext = path.match(/\.(js|jsx|ts|tsx)$/)?.[0] || '';
      const runtimeExt = ext === '.ts' ? '.js' : ext === '.tsx' ? '.jsx' : ext;
      return `from ${quote1}#app/${path.replace(/\.(js|jsx|ts|tsx)$/, runtimeExt)}${quote2}`;
    },
  },
  {
    from: /from\s+(['"])prod\/app\/shared\/([^'"]+)(['"])/g,
    to: (match, quote1, path, quote2) => {
      const ext = path.match(/\.(js|jsx|ts|tsx|d\.js)$/)?.[0] || '';
      const runtimeExt = ext === '.ts' ? '.js' : ext === '.tsx' ? '.jsx' : ext === '.d.js' ? '.d.js' : ext;
      return `from ${quote1}#shared/${path.replace(/\.(js|jsx|ts|tsx|d\.js)$/, runtimeExt)}${quote2}`;
    },
  },
  {
    from: /from\s+(['"])shared\/language(['"])/g,
    to: `from $1#shared/language/index.js$2`,
  },
  {
    from: /from\s+(['"])#api\/odm\/BulkWriteStream\.js(['"])/g,
    to: `from $1#api/core/infrastructure/mongodb/common/BulkWriteStream.js$2`,
  },
  {
    from: /from\s+(['"])#api\/files\/BaseFile\.js(['"])/g,
    to: `from $1#api/core/domain/files/BaseFile.js$2`,
  },
];

const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*', '**/prod/**', '**/coverage/**'],
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
