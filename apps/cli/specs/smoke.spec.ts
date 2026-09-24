import { spawnSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const BIN = path.join(ROOT, 'apps/cli/bin/uwazi.js');

/** A module loader hook that appends every loaded module URL to $LOADED_MODULES_LOG. */
const LOAD_HOOKS = `
  import { appendFileSync } from 'node:fs';
  export async function load(url, context, next) {
    appendFileSync(process.env.LOADED_MODULES_LOG, url + '\\n');
    return next(url, context);
  }
`;
const RECORD_LOADS = `data:text/javascript,${encodeURIComponent(
  `import { register } from 'node:module';
   register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(LOAD_HOOKS)}`)});`
)}`;

const uwazi = (args: string[], env: Record<string, string> = {}) =>
  spawnSync('node', ['--no-experimental-fetch', '--import', 'tsx', ...[BIN, ...args]], {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, NODE_ENV: 'development', ...env },
  });

const loadedModules = (args: string[]) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'uwazi-cli-'));
  const log = path.join(dir, 'loaded.log');
  try {
    const { status } = uwazi(args, {
      NODE_OPTIONS: `--import=${RECORD_LOADS}`,
      LOADED_MODULES_LOG: log,
    });
    return { status, modules: readFileSync(log, 'utf-8').trim().split('\n') };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const BACKEND = /\/app\/api\/(odm|tenants|core\/infrastructure)\/|\/node_modules\/@sentry\//;

describe('uwazi binary', () => {
  it('should print help on stdout and exit 0', () => {
    const { status, stdout } = uwazi(['--help']);

    expect(status).toBe(0);
    expect(stdout).toContain('uwazi');
    expect(stdout).toContain('--pretty');
  });

  it('should exit 2 with a usage error payload on stderr and nothing on stdout', () => {
    const { status, stdout, stderr } = uwazi(['does-not-exist']);

    expect(status).toBe(2);
    expect(stdout).toBe('');
    expect(JSON.parse(stderr).error).toMatchObject({ code: 'usage.invalid' });
  });

  it.each([
    ['help', ['users', 'create', '--help'], 0],
    ['--schema', ['users', 'create', '--schema'], 0],
    ['an invalid request', ['users', 'create', '--tenant', 'x', '--request', '{}'], 2],
  ])('should not load the backend for %s', (_case, args, exitCode) => {
    const { status, modules } = loadedModules(args);

    expect(status).toBe(exitCode);
    expect(modules).toContainEqual(expect.stringContaining('/apps/cli/CliApplication.ts'));
    expect(modules.filter(url => BACKEND.test(url))).toEqual([]);
  });
});
