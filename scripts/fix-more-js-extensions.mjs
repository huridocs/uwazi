import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const replacements = [
  {
    from: /from\s+(['"])#app\/App\/ShowIf\.js(['"])/g,
    to: `from $1#app/App/ShowIf.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/Layout\/Icon\.js(['"])/g,
    to: `from $1#app/Layout/Icon.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/Forms\/components\/DatePicker\.js(['"])/g,
    to: `from $1#app/Forms/components/DatePicker.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/utils\/RequestParams\.ts(['"])/g,
    to: `from $1#app/utils/RequestParams.js$2`,
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
