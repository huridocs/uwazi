import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function fixBrokenImports() {
  const files = await glob('app/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**'],
  });

  let fixedCount = 0;

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      let modified = false;

      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].trim() === 'import {' && lines[i + 1].trim().startsWith('import {')) {
          const nextImportLine = lines[i + 1];
          const importMatch = nextImportLine.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
          
          if (importMatch) {
            const [, imports, path] = importMatch;
            lines[i] = nextImportLine;
            lines.splice(i + 1, 1);
            modified = true;
            fixedCount++;
            console.log(`✅ Fixed: ${file}:${i + 1}`);
          }
        }
      }

      if (modified) {
        writeFileSync(file, lines.join('\n'), 'utf-8');
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} broken import statements`);
}

fixBrokenImports().catch(console.error);
