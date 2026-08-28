import { spawnSync } from 'node:child_process';

// Arguments to jest: whatever is passed on the CLI, otherwise the project
// default for maxWorkers. Jest turns repeated -w/--maxWorkers flags into an
// array, so the default can't be appended after user flags — instead it is
// injected only when the caller didn't pick their own worker strategy
// (-w/--maxWorkers or --runInBand/-i).
const passed = process.argv.slice(2);

const isWorkerFlag = arg =>
  arg === '-w' ||
  arg.startsWith('-w=') ||
  arg.startsWith('--maxWorkers') ||
  arg.startsWith('--max-workers');

const hasWorkerChoice = passed.some(
  arg => isWorkerFlag(arg) || arg === '--runInBand' || arg === '-i',
);

const args = hasWorkerChoice ? passed : ['-w=4', ...passed];

const result = spawnSync(
  'node',
  ['./node_modules/.bin/jest', ...args],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 0);
