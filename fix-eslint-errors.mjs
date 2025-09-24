#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function fixESLintErrors(content, filePath) {
  let changed = false;
  let modifiedContent = content;

  // Fix fs import issues
  const fixes = [
    // Fix incorrect fs imports
    {
      pattern: /import\s+{\s*promises as fs\s*}\s+from\s+['"]fs['"];?\s*\/\/\s*eslint-disable-next-line\s+node\/no-restricted-import/g,
      replacement: () => {
        changed = true;
        return `import { promises as fs } from 'fs';`;
      }
    },
    
    // Fix missing fs imports
    {
      pattern: /^((?!import.*fs).)*$/gm,
      replacement: (match, offset, string) => {
        // Only add fs import if the file uses fs but doesn't import it
        if (string.includes('fs.') || string.includes('fsPromises') || string.includes('unlink')) {
          if (!string.includes('import') || !string.includes('fs')) {
            changed = true;
            return `import { promises as fs } from 'fs';\n${match}`;
          }
        }
        return match;
      }
    },
    
    // Fix unused imports
    {
      pattern: /import\s+{\s*applicationEventsBus\s*}\s+from\s+['"][^'"]+['"];\s*$/gm,
      replacement: () => {
        changed = true;
        return '';
      }
    },
    
    // Fix duplicate imports
    {
      pattern: /import\s+{\s*([^}]+)\s*}\s+from\s+['"][^'"]+['"];\s*import\s+{\s*([^}]+)\s*}\s+from\s+['"][^'"]+['"];\s*$/gm,
      replacement: (match, imports1, imports2) => {
        // Check if there are duplicate imports
        const imports1List = imports1.split(',').map(i => i.trim());
        const imports2List = imports2.split(',').map(i => i.trim());
        const duplicates = imports1List.filter(imp => imports2List.includes(imp));
        
        if (duplicates.length > 0) {
          changed = true;
          const uniqueImports = [...new Set([...imports1List, ...imports2List])];
          return `import { ${uniqueImports.join(', ')} } from 'fs';\n`;
        }
        return match;
      }
    }
  ];

  for (const fix of fixes) {
    if (fix.replacement) {
      modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
    }
  }

  return { content: modifiedContent, changed };
}

async function run() {
  console.log('🔍 Finding and fixing ESLint errors...');
  
  // Find all TypeScript and JavaScript files
  const files = await glob('app/**/*.{ts,js}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has ESLint issues
      const hasIssues = content.includes('eslint-disable-next-line') ||
                       content.includes('fs.') ||
                       content.includes('fsPromises') ||
                       content.includes('applicationEventsBus') ||
                       content.includes('unlink');
      
      if (!hasIssues) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixESLintErrors(content, file);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed ESLint errors in ${file}`);
        filesModified++;
        totalReplacements++;
      }
    } catch (error) {
      console.error(`❌ Error processing file ${file}:`, error.message);
    }
  }

  console.log(`\n🎉 Summary:`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total replacements: ${totalReplacements}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
