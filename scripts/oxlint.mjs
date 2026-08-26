import { spawnSync } from 'node:child_process';

// oxlint flags that consume a following value, so we don't mistake the value
// for a positional path (e.g. `--format json app`).
const VALUE_FLAGS = new Set([
  '-c', '--config',
  '--tsconfig',
  '-A', '--allow',
  '-W', '--warn',
  '-D', '--deny',
  '--ignore-path',
  '--ignore-pattern',
  '--max-warnings',
  '-f', '--format',
  '--debug',
  '--threads',
  '--report-unused-disable-directives-severity',
]);

const args = process.argv.slice(2);
const flags = [];
const paths = [];

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  // Everything after `--` is treated as a positional path.
  if (arg === '--') {
    paths.push(...args.slice(i + 1));
    break;
  }

  if (arg.startsWith('-')) {
    flags.push(arg);
    const name = arg.split('=')[0];
    // Consume the next token as this flag's value when it isn't already
    // attached with `=` (e.g. `--format json` vs `--format=json`).
    if (VALUE_FLAGS.has(name) && !arg.includes('=') && i + 1 < args.length) {
      flags.push(args[i + 1]);
      i += 1;
    }
  } else {
    paths.push(arg);
  }
}

// Default paths when none are provided on the CLI.
const targets = paths.length ? paths : ['app', 'e2e', 'cypress'];

const result = spawnSync(
  './node_modules/.bin/oxlint',
  [...flags, ...targets],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
