#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const repoRoot = process.cwd();
const scriptsDir = path.join(repoRoot, 'scripts', 'scripts.v2');

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
  } else {
    return null;
  }
  const targetBase = path.join(baseDir, relInside);
  const fileDir = path.dirname(filePath);

  // Try file.ts/js
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

  // Default to .ts path if nothing found; will still point to .js import
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
    // Likely a directory with existing index.js/ts
    if (!relFromFile.endsWith('/index')) {
      relFromFile = `${relFromFile}.js`;
    } else {
      relFromFile = `${relFromFile}.js`;
    }
  }

  return relFromFile;
}

function fixImportsInContent(filePath, content) {
  let changed = false;

  // Replace api/* and shared/* in ESM imports
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

  // yargs CJS -> ESM with await argv
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
  if (!fs.existsSync(scriptsDir)) {
    console.log('scripts/scripts.v2 not found, skipping');
    process.exit(0);
  }
  const files = await glob('scripts/scripts.v2/**/*.{ts,js,tsx}', { dot: false });
  let changedCount = 0;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const { content, changed } = fixImportsInContent(file, src);
    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`fixed ${file}`);
      changedCount += 1;
    }
  }
  console.log(`done, files changed: ${changedCount}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
