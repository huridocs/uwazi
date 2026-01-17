import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  const originalContent = content;

  // Replace .ts with .js in import statements
  // Pattern: from '#prefix/path/file.ts'
  content = content.replace(/from\s+(['"])(#[^'"]*?)\.ts\1/g, (match, quote, path) => {
    modified = true;
    return `from ${quote}${path}.js${quote}`;
  });

  // Replace .ts with .js in require statements
  content = content.replace(/require\s*\((['"])(#[^'"]*?)\.ts\1\)/g, (match, quote, path) => {
    modified = true;
    return `require(${quote}${path}.js${quote})`;
  });

  // Replace .ts with .js in dynamic imports
  content = content.replace(/import\s*\((['"])(#[^'"]*?)\.ts\1\)/g, (match, quote, path) => {
    modified = true;
    return `import(${quote}${path}.js${quote})`;
  });

  // Replace .ts with .js in export from statements
  content = content.replace(/export\s+.*\s+from\s+(['"])(#[^'"]*?)\.ts\1/g, (match, quote, path) => {
    modified = true;
    return match.replace('.ts', '.js');
  });

  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${totalFixed} files`);
