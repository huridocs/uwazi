#!/usr/bin/env node
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const script = process.argv[2];
const args = process.argv.slice(3);

if (!script) {
  process.stderr.write('Usage: runner.js <script> [args...]\n');
  process.exit(1);
}

const tsxPath = join(__dirname, '../node_modules/.bin/tsx');
const useTsx = existsSync(tsxPath);

const nodeArgs = ['--no-experimental-fetch'];
if (useTsx) {
  nodeArgs.push('--import', 'tsx');
}
nodeArgs.push(script, ...args);

const child = spawn('node', nodeArgs, { stdio: 'inherit' });
child.on('close', code => process.exit(code || 0));
