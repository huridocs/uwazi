import { readFileSync, writeFileSync, renameSync } from 'fs';
import { glob } from 'glob';

const jsxFiles = await glob('app/react/**/*.js', {
  ignore: ['**/*.spec.js', '**/specs/**', '**/node_modules/**'],
});

const filesToConvert = [];

for (const file of jsxFiles) {
  const content = readFileSync(file, 'utf-8');
  
  const hasJSX = /<[A-Z]/.test(content) || /<\/[A-Z]/.test(content) || /return\s*\(?\s*</.test(content);
  const importsReact = /from\s+['"]react['"]/.test(content) || /import\s+React/.test(content);
  
  if (hasJSX || importsReact) {
    filesToConvert.push(file);
  }
}

console.log(`Found ${filesToConvert.length} files with JSX to convert:`);
filesToConvert.forEach(f => console.log(`  - ${f}`));

for (const file of filesToConvert) {
  const newFile = file.replace(/\.js$/, '.tsx');
  try {
    renameSync(file, newFile);
    console.log(`✅ Converted: ${file} → ${newFile}`);
  } catch (error) {
    console.error(`❌ Error converting ${file}:`, error.message);
  }
}

console.log(`\n✨ Converted ${filesToConvert.length} files`);
