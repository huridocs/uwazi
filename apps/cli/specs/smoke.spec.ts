import { spawnSync } from 'child_process';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const BIN = path.join(ROOT, 'apps/cli/bin/uwazi.js');

const uwazi = (...args: string[]) =>
  spawnSync('node', ['--no-experimental-fetch', '--import', 'tsx', BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, NODE_ENV: 'development' },
  });

describe('uwazi binary', () => {
  it('should print help on stdout and exit 0', () => {
    const { status, stdout } = uwazi('--help');

    expect(status).toBe(0);
    expect(stdout).toContain('uwazi');
    expect(stdout).toContain('--pretty');
  });

  it('should exit 2 with a usage error payload on stderr and nothing on stdout', () => {
    const { status, stdout, stderr } = uwazi('does-not-exist');

    expect(status).toBe(2);
    expect(stdout).toBe('');
    expect(JSON.parse(stderr).error).toMatchObject({ code: 'usage.invalid' });
  });
});
