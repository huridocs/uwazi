import { z } from 'zod';
import { ConflictError } from '#api/core/domain/error/ConflictError.js';
import { CliApplication } from '../CliApplication.js';
import { ExitCode } from '../errors/ExitCode.js';
import { Route } from '../routing/Route.js';
import { MemoryStream } from '../testing/MemoryStream.js';

class ThingExists extends ConflictError {
  constructor() {
    super('Thing already exists', 'thing.exists');
  }
}

const listThings = (handle: Route['handle']): Route => ({
  group: 'things',
  name: 'list',
  describe: 'List things',
  needs: { redis: true },
  fieldMap: { tenant: '--tenant' },
  options: y => y.option('tenant', { type: 'string' }),
  toInput: argv => z.object({ tenant: z.string() }).parse(argv),
  handle,
});

const setUp = (route: Route, env: Record<string, string | undefined> = { NODE_ENV: 'test' }) => {
  const stdout = new MemoryStream();
  const stderr = new MemoryStream();
  const connections = {
    open: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const app = new CliApplication({ routes: [route], connections, stdout, stderr, env });
  return { app, stdout, stderr, connections };
};

describe('CliApplication', () => {
  it('should run the route and print its result as JSON on stdout', async () => {
    const handle = jest.fn().mockResolvedValue([{ name: 'a' }]);
    const { app, stdout, stderr, connections } = setUp(listThings(handle));

    const exitCode = await app.run(['things', 'list', '--tenant', 'acme', '--json']);

    expect(exitCode).toBe(ExitCode.Ok);
    expect(handle).toHaveBeenCalledWith({ tenant: 'acme' });
    expect(JSON.parse(stdout.text)).toEqual([{ name: 'a' }]);
    expect(stderr.text).toBe('');
    expect(connections.open).toHaveBeenCalledWith({ redis: true });
    expect(connections.close).toHaveBeenCalledTimes(1);
  });

  it('should print a human-readable result without --json', async () => {
    const { app, stdout } = setUp(listThings(jest.fn().mockResolvedValue([{ name: 'a' }])));

    await app.run(['things', 'list', '--tenant', 'acme']);

    expect(stdout.text).toBe('name\na\n');
  });

  it('should map a route error to its exit code and payload, and still close', async () => {
    const { app, stdout, stderr, connections } = setUp(
      listThings(jest.fn().mockRejectedValue(new ThingExists()))
    );

    const exitCode = await app.run(['things', 'list', '--tenant', 'acme', '--json']);

    expect(exitCode).toBe(ExitCode.Conflict);
    expect(stdout.text).toBe('');
    expect(JSON.parse(stderr.text)).toEqual({
      error: { code: 'thing.exists', category: 'conflict', message: 'Thing already exists' },
    });
    expect(connections.close).toHaveBeenCalledTimes(1);
  });

  it('should reject invalid input with the flag name before connecting', async () => {
    const { app, stderr, connections } = setUp(listThings(jest.fn()));

    const exitCode = await app.run(['things', 'list', '--json']);

    expect(exitCode).toBe(ExitCode.Validation);
    expect(JSON.parse(stderr.text).error.validation).toEqual([
      expect.objectContaining({ field: '--tenant' }),
    ]);
    expect(connections.open).not.toHaveBeenCalled();
  });

  it('should fail with config.missing in production before connecting', async () => {
    const { app, stderr, connections } = setUp(listThings(jest.fn()), {
      NODE_ENV: 'production',
    });

    const exitCode = await app.run(['things', 'list', '--tenant', 'acme', '--json']);

    expect(exitCode).toBe(ExitCode.Unexpected);
    expect(JSON.parse(stderr.text).error).toMatchObject({
      code: 'config.missing',
      details: { missing: expect.arrayContaining(['MONGO_URI', 'REDIS_HOST']) },
    });
    expect(connections.open).not.toHaveBeenCalled();
  });

  it.each([
    ['an unknown command', ['nope', '--json']],
    ['a missing command', ['--json']],
    ['a missing subcommand', ['things', '--json']],
    ['an unknown option', ['things', 'list', '--tenant', 'acme', '--nope', '--json']],
  ])('should report %s as a usage error on stderr', async (_case, argv) => {
    const { app, stdout, stderr, connections } = setUp(listThings(jest.fn()));

    const exitCode = await app.run(argv);

    expect(exitCode).toBe(ExitCode.Validation);
    expect(stdout.text).toBe('');
    expect(JSON.parse(stderr.text).error).toMatchObject({
      code: 'usage.invalid',
      category: 'validation',
    });
    expect(connections.open).not.toHaveBeenCalled();
  });

  it('should reject any command when no routes are registered', async () => {
    const stderr = new MemoryStream();
    const app = new CliApplication({ routes: [], stdout: new MemoryStream(), stderr });

    const exitCode = await app.run(['anything', '--json']);

    expect(exitCode).toBe(ExitCode.Validation);
    expect(JSON.parse(stderr.text).error.code).toBe('usage.invalid');
  });

  it('should restore console methods after the command', async () => {
    const original = console.log;
    const { app } = setUp(listThings(jest.fn().mockResolvedValue([])));

    await app.run(['things', 'list', '--tenant', 'acme']);

    expect(console.log).toBe(original);
  });
});
