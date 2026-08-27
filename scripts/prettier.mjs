import { spawnSync } from 'node:child_process';

// Wrapper so `yarn prettier` checks and `yarn prettier --write` fixes, without
// ever handing prettier both --check and --write at once (the CLI rejects the
// combination). Mirrors scripts/test.mjs and scripts/oxlint.mjs: the mode is
// decided here, and everything else is passed through untouched.
const passed = process.argv.slice(2);

// Prettier's `-w` is the short form of `--write`.
const hasWrite = passed.some(arg => arg === '--write' || arg === '-w');
const hasCheck = passed.includes('--check');

const mode = hasWrite ? '--write' : hasCheck ? '--check' : null;
const rest = passed.filter(arg => arg !== '--write' && arg !== '-w' && arg !== '--check');

// Default targets when the caller didn't pass any paths of their own.
const hasPaths = rest.some(arg => !arg.startsWith('-'));
const targets = hasPaths ? rest : ['app/**/*.{js,ts,tsx}', ...rest];

const args = ['--cache', ...(mode ? [mode] : ['--check']), ...targets];

const result = spawnSync('./node_modules/.bin/prettier', args, {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
