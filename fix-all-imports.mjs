#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function resolveAlias(filePath, alias) {
  let baseDir;
  let relInside;
  
  if (alias.startsWith('api/')) {
    baseDir = path.join(repoRoot, 'app', 'api');
    relInside = alias.slice(4);
  } else if (alias.startsWith('shared/')) {
    baseDir = path.join(repoRoot, 'app', 'shared');
    relInside = alias.slice(7);
  } else if (alias.startsWith('app/')) {
    baseDir = path.join(repoRoot, 'app');
    relInside = alias.slice(4);
  } else {
    return null;
  }
  
  const targetBase = path.join(baseDir, relInside);
  const fileDir = path.dirname(filePath);

  // Try different file extensions and directory structures
  const candidates = [
    `${targetBase}.ts`,
    `${targetBase}.tsx`,
    `${targetBase}.js`,
    path.join(targetBase, 'index.ts'),
    path.join(targetBase, 'index.tsx'),
    path.join(targetBase, 'index.js'),
  ];

  let chosen;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      chosen = c;
      break;
    }
  }

  // Default to .ts path if nothing found
  const resolvedAbs = chosen || `${targetBase}.ts`;

  let relFromFile = path.relative(fileDir, resolvedAbs);
  relFromFile = toPosix(relFromFile);
  if (!relFromFile.startsWith('.')) relFromFile = `./${relFromFile}`;

  // Ensure .js extension in import
  if (relFromFile.endsWith('.ts') || relFromFile.endsWith('.tsx')) {
    relFromFile = relFromFile.replace(/\.tsx?$/, '.js');
  } else if (relFromFile.endsWith('/index.ts') || relFromFile.endsWith('/index.tsx')) {
    relFromFile = relFromFile.replace(/\/index\.tsx?$/, '/index.js');
  } else if (!/\.(js|mjs|cjs)$/.test(relFromFile)) {
    relFromFile = `${relFromFile}.js`;
  }

  return relFromFile;
}

function fixImportsInContent(filePath, content) {
  let changed = false;

  // Replace api/*, shared/*, and app/* in ESM imports
  content = content.replace(/from\s+(["'])(api\/[\w\/.\-]+)\1/g, (m, q, a) => {
    const rel = resolveAlias(filePath, a);
    if (rel) {
      changed = true;
      return `from ${q}${rel}${q}`;
    }
    return m;
  });

  content = content.replace(/from\s+(["'])(shared\/[\w\/.\-]+)\1/g, (m, q, a) => {
    const rel = resolveAlias(filePath, a);
    if (rel) {
      changed = true;
      return `from ${q}${rel}${q}`;
    }
    return m;
  });

  content = content.replace(/from\s+(["'])(app\/[\w\/.\-]+)\1/g, (m, q, a) => {
    const rel = resolveAlias(filePath, a);
    if (rel) {
      changed = true;
      return `from ${q}${rel}${q}`;
    }
    return m;
  });

  // Convert require('yargs') to ESM if present
  if (/require\(['"]yargs['"]\)/.test(content)) {
    if (!/^import\s+yargs\s+from\s+['"]yargs['"]/m.test(content)) {
      content = `import yargs from 'yargs';\n` + content;
      changed = true;
    }
    // Replace pattern: const { ... } = require('yargs').option(...).argv;
    content = content.replace(
      /const\s*\{([\s\S]*?)\}\s*=\s*require\(['"]yargs['"]\)([\s\S]*?)\.argv\s*;/m,
      (m, group, chain) => `const {${group}} = await yargs${chain}.argv;`
    );
  }

  return { content, changed };
}

async function run() {
  console.log('🔍 Finding all files with path aliases...');
  
  // Find all TypeScript and JavaScript files
  const files = await glob('**/*.{ts,js,tsx,jsx}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has path aliases
      const hasAliases = /from\s+['"](?:api\/|shared\/|app\/)([^'"]+)['"]/g.test(content) || 
                        /require\(['"]yargs['"]\)/.test(content);
      
      if (!hasAliases) continue;

      console.log(`🔧 Processing: ${file}`);
      
      const { content: modifiedContent, changed } = fixImportsInContent(file, content);
      
      if (changed) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed imports in ${file}`);
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
