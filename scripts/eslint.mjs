import { spawnSync } from 'node:child_process';

// Paths to lint: whatever is passed on the CLI, otherwise the project default.
const passed = process.argv.slice(2);
const targets = passed.length ? passed : ['e2e', 'app', 'cypress'];

const result = spawnSync(
  './node_modules/.bin/eslint',
  [...targets, '--quiet', '--cache', '--concurrency=auto'],
  { stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 0);