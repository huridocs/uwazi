import { Readable } from 'stream';
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
  tenancy: 'none',
  needs: { redis: true },
  request: z.object({ name: z.string() }).strict(),
  fieldMap: {},
  handle,
});

const setUp = (
  route: Route,
  env: Record<string, string | undefined> = { NODE_ENV: 'test' },
  stdin: Readable = Readable.from([])
) => {
  const stdout = new MemoryStream();
  const stderr = new MemoryStream();
  const connections = {
    open: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const app = new CliApplication({ routes: [route], connections, stdout, stderr, stdin, env });
  return { app, stdout, stderr, connections };
};

const request = (value: unknown) => ['--request', JSON.stringify(value)];

describe('CliApplication', () => {
  it('should run the route with the --request JSON and print its result as JSON', async () => {
    const handle = jest.fn().mockResolvedValue([{ name: 'a' }]);
    const { app, stdout, stderr, connections } = setUp(listThings(handle));

    const exitCode = await app.run(['things', 'list', ...request({ name: 'a' })]);

    expect(exitCode).toBe(ExitCode.Ok);
    expect(handle).toHaveBeenCalledWith({ name: 'a' });
    expect(JSON.parse(stdout.text)).toEqual([{ name: 'a' }]);
    expect(stderr.text).toBe('');
    expect(connections.open).toHaveBeenCalledWith({ redis: true });
    expect(connections.close).toHaveBeenCalledTimes(1);
  });

  it('should read the request from stdin with --request -', async () => {
    const handle = jest.fn().mockResolvedValue([]);
    const { app } = setUp(listThings(handle), undefined, Readable.from(['{"name":', '"a"}']));

    const exitCode = await app.run(['things', 'list', '--request', '-']);

    expect(exitCode).toBe(ExitCode.Ok);
    expect(handle).toHaveBeenCalledWith({ name: 'a' });
  });

  it('should treat a missing --request as an empty object', async () => {
    const handle = jest.fn().mockResolvedValue([]);
    const { app } = setUp({ ...listThings(handle), request: z.object({}).strict() });

    const exitCode = await app.run(['things', 'list']);

    expect(exitCode).toBe(ExitCode.Ok);
    expect(handle).toHaveBeenCalledWith({});
  });

  it('should print a human-readable result with --pretty', async () => {
    const { app, stdout } = setUp(listThings(jest.fn().mockResolvedValue([{ name: 'a' }])));

    await app.run(['things', 'list', ...request({ name: 'a' }), '--pretty']);

    expect(stdout.text).toBe('name\na\n');
  });

  it('should map a route error to its exit code and payload, and still close', async () => {
    const { app, stdout, stderr, connections } = setUp(
      listThings(jest.fn().mockRejectedValue(new ThingExists()))
    );

    const exitCode = await app.run(['things', 'list', ...request({ name: 'a' })]);

    expect(exitCode).toBe(ExitCode.Conflict);
    expect(stdout.text).toBe('');
    expect(JSON.parse(stderr.text)).toEqual({
      error: { code: 'thing.exists', category: 'conflict', message: 'Thing already exists' },
    });
    expect(connections.close).toHaveBeenCalledTimes(1);
  });

  it('should reject an invalid request with the request field before connecting', async () => {
    const { app, stderr, connections } = setUp(listThings(jest.fn()));

    const exitCode = await app.run(['things', 'list', ...request({ name: 1 })]);

    expect(exitCode).toBe(ExitCode.Validation);
    expect(JSON.parse(stderr.text).error.validation).toEqual([
      expect.objectContaining({ field: 'name' }),
    ]);
    expect(connections.open).not.toHaveBeenCalled();
  });

  it('should reject a request that is not JSON as a usage error before connecting', async () => {
    const { app, stderr, connections } = setUp(listThings(jest.fn()));

    const exitCode = await app.run(['things', 'list', '--request', '{name:']);

    expect(exitCode).toBe(ExitCode.Validation);
    expect(JSON.parse(stderr.text).error).toMatchObject({
      code: 'usage.invalid',
      message: expect.stringContaining('--request'),
    });
    expect(connections.open).not.toHaveBeenCalled();
  });

  it('should print the request JSON schema with --schema, without connecting', async () => {
    const handle = jest.fn();
    const { app, stdout, connections } = setUp(listThings(handle));

    const exitCode = await app.run(['things', 'list', '--schema']);

    expect(exitCode).toBe(ExitCode.Ok);
    expect(JSON.parse(stdout.text)).toMatchObject({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: false,
    });
    expect(handle).not.toHaveBeenCalled();
    expect(connections.open).not.toHaveBeenCalled();
  });

  it('should fail with config.missing in production before connecting', async () => {
    const { app, stderr, connections } = setUp(listThings(jest.fn()), {
      NODE_ENV: 'production',
    });

    const exitCode = await app.run(['things', 'list', ...request({ name: 'a' })]);

    expect(exitCode).toBe(ExitCode.Unexpected);
    expect(JSON.parse(stderr.text).error).toMatchObject({
      code: 'config.missing',
      details: { missing: expect.arrayContaining(['MONGO_URI', 'REDIS_HOST']) },
    });
    expect(connections.open).not.toHaveBeenCalled();
  });

  it.each([
    ['an unknown command', ['nope']],
    ['a missing command', []],
    ['a missing subcommand', ['things']],
    ['an unknown option', ['things', 'list', '--name', 'a']],
  ])('should report %s as a JSON usage error on stderr', async (_case, argv) => {
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

  it('should report a usage error in human form with --pretty', async () => {
    const { app, stderr } = setUp(listThings(jest.fn()));

    await app.run(['nope', '--pretty']);

    expect(stderr.text).toContain('error: ');
    expect(stderr.text).toContain('[usage.invalid]');
    expect(() => JSON.parse(stderr.text)).toThrow();
  });

  it('should exit with the first failure when a result spans tenants', async () => {
    const perTenant = {
      results: [{ tenant: 'a', data: [] }],
      errors: [{ tenant: 'b', error: { code: 'x', category: 'not_found', message: 'm' } }],
    };
    const { app, stdout } = setUp(listThings(jest.fn().mockResolvedValue(perTenant)));

    const exitCode = await app.run(['things', 'list', ...request({ name: 'a' })]);

    expect(exitCode).toBe(ExitCode.NotFound);
    expect(JSON.parse(stdout.text)).toEqual(perTenant);
  });

  describe('tenant flags', () => {
    const scoped = (tenancy: Route['tenancy']): Route => ({
      ...listThings(jest.fn()),
      tenancy,
      request: z.object({}),
    });

    it.each([
      ['single', ['things', 'list']],
      ['single-or-all', ['things', 'list']],
      ['single-or-all', ['things', 'list', '--tenant', 'a', '--all-tenants']],
    ] as const)('should reject a bad selection for %s before connecting', async (tenancy, argv) => {
      const { app, stderr, connections } = setUp(scoped(tenancy));

      const exitCode = await app.run([...argv]);

      expect(exitCode).toBe(ExitCode.Validation);
      expect(JSON.parse(stderr.text).error.validation).toEqual([
        expect.objectContaining({ field: '--tenant' }),
      ]);
      expect(connections.open).not.toHaveBeenCalled();
    });

    it('should not offer --all-tenants to single-tenant commands', async () => {
      const { app, stderr } = setUp(scoped('single'));

      const exitCode = await app.run(['things', 'list', '--all-tenants']);

      expect(exitCode).toBe(ExitCode.Validation);
      expect(JSON.parse(stderr.text).error.code).toBe('usage.invalid');
    });

    it('should not offer tenant flags to commands that are not tenant-scoped', async () => {
      const { app, stderr } = setUp(scoped('none'));

      const exitCode = await app.run(['things', 'list', '--tenant', 'a']);

      expect(exitCode).toBe(ExitCode.Validation);
      expect(JSON.parse(stderr.text).error.code).toBe('usage.invalid');
    });
  });

  it('should call route methods on the route itself, keeping `this`', async () => {
    class ClassRoute implements Route<{ name: string }, string> {
      readonly group = 'things';

      readonly name = 'show';

      readonly describe = 'Show a thing';

      readonly tenancy = 'none';

      readonly needs = { redis: false };

      readonly request = z.object({ name: z.string() });

      readonly fieldMap = {};

      private readonly prefix = 'shown:';

      async handle(input: { name: string }) {
        return `${this.prefix}${input.name}`;
      }
    }
    const { app, stdout } = setUp(new ClassRoute());

    const exitCode = await app.run(['things', 'show', ...request({ name: 'acme' })]);

    expect(exitCode).toBe(ExitCode.Ok);
    expect(JSON.parse(stdout.text)).toBe('shown:acme');
  });

  it('should reject any command when no routes are registered', async () => {
    const stderr = new MemoryStream();
    const app = new CliApplication({ routes: [], stdout: new MemoryStream(), stderr });

    const exitCode = await app.run(['anything']);

    expect(exitCode).toBe(ExitCode.Validation);
    expect(JSON.parse(stderr.text).error.code).toBe('usage.invalid');
  });

  it('should restore console methods after the command', async () => {
    const original = console.log;
    const { app } = setUp(listThings(jest.fn().mockResolvedValue([])));

    await app.run(['things', 'list', ...request({ name: 'a' })]);

    expect(console.log).toBe(original);
  });
});
