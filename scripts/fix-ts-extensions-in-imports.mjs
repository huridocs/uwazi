import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  const replacements = [
    {
      from: /(['"])#(?:app|api|shared|UI|V2)\/[^'"]*?\.tsx(['"])/g,
      to: (match, quote1, quote2) => match.replace(/\.tsx(['"])$/, '.jsx$1'),
    },
    {
      from: /(['"])#(?:app|api|shared|UI|V2)\/[^'"]*?\.ts(['"])/g,
      to: (match, quote1, quote2) => match.replace(/\.ts(['"])$/, '.js$1'),
    },
    {
      from: /from\s+(['"])#(?:app|api|shared|UI|V2)\/[^'"]*?\.tsx(['"])/g,
      to: (match) => match.replace(/\.tsx(['"])$/, '.jsx$1'),
    },
    {
      from: /from\s+(['"])#(?:app|api|shared|UI|V2)\/[^'"]*?\.ts(['"])/g,
      to: (match) => match.replace(/\.ts(['"])$/, '.js$1'),
    },
    {
      from: /import\s+.*?from\s+(['"])#(?:app|api|shared|UI|V2)\/[^'"]*?\.tsx(['"])/g,
      to: (match) => match.replace(/\.tsx(['"])$/, '.jsx$1'),
    },
    {
      from: /import\s+.*?from\s+(['"])#(?:app|api|shared|UI|V2)\/[^'"]*?\.ts(['"])/g,
      to: (match) => match.replace(/\.ts(['"])$/, '.js$1'),
    },
  ];
  
  for (const { from, to } of replacements) {
    const newContent = content.replace(from, to);
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
