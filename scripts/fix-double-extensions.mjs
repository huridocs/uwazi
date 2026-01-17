import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Fix .ts.js to .js
  content = content.replace(/\.ts\.js(['"])/g, (match, quote) => {
    modified = true;
    return `.js${quote}`;
  });

  // Fix .tsx.js to .jsx
  content = content.replace(/\.tsx\.js(['"])/g, (match, quote) => {
    modified = true;
    return `.jsx${quote}`;
  });

  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${totalFixed} files`);
