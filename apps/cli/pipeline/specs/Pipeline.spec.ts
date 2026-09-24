import { CliContext } from '../CliContext.js';
import { Middleware } from '../Middleware.js';
import { Pipeline } from '../Pipeline.js';
import { AuditMiddleware } from '../AuditMiddleware.js';

const recording = (name: string, calls: string[]): Middleware => ({
  async handle(_context, next) {
    calls.push(`${name}:before`);
    await next();
    calls.push(`${name}:after`);
  },
});

const context = (): CliContext => ({ route: 'users list', input: {}, json: false });

describe('Pipeline', () => {
  it('should run middlewares in order, each wrapping the next', async () => {
    const calls: string[] = [];

    await new Pipeline([recording('a', calls), recording('b', calls)]).run(context());

    expect(calls).toEqual(['a:before', 'b:before', 'b:after', 'a:after']);
  });

  it('should let a middleware set the result on the context', async () => {
    const ctx = context();

    await new Pipeline([
      {
        async handle(c) {
          c.result = { ok: true };
        },
      },
    ]).run(ctx);

    expect(ctx.result).toEqual({ ok: true });
  });

  it('should stop the chain when a middleware does not call next', async () => {
    const calls: string[] = [];

    await new Pipeline([{ async handle() {} }, recording('never', calls)]).run(context());

    expect(calls).toEqual([]);
  });

  it('should propagate errors thrown anywhere in the chain', async () => {
    const failing: Middleware = {
      async handle() {
        throw new Error('boom');
      },
    };

    await expect(new Pipeline([recording('a', []), failing]).run(context())).rejects.toThrow(
      'boom'
    );
  });

  it('should reject a middleware calling next twice', async () => {
    const twice: Middleware = {
      async handle(_c, next) {
        await next();
        await next();
      },
    };

    await expect(new Pipeline([twice]).run(context())).rejects.toThrow(
      'next() called more than once'
    );
  });
});

describe('AuditMiddleware', () => {
  it('should pass through without touching the context when no recorder is plugged in', async () => {
    const ctx = context();
    const next = jest.fn().mockResolvedValue(undefined);

    await new AuditMiddleware().handle(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx).toEqual(context());
  });

  it('should record a successful run', async () => {
    const recorder = { record: jest.fn().mockResolvedValue(undefined) };

    await new AuditMiddleware(recorder).handle(context(), async () => {});

    expect(recorder.record).toHaveBeenCalledWith({
      route: 'users list',
      input: {},
      outcome: 'success',
    });
  });

  it('should record a failed run and rethrow the error', async () => {
    const recorder = { record: jest.fn().mockResolvedValue(undefined) };
    const error = new Error('boom');

    await expect(
      new AuditMiddleware(recorder).handle(context(), async () => {
        throw error;
      })
    ).rejects.toBe(error);

    expect(recorder.record).toHaveBeenCalledWith({
      route: 'users list',
      input: {},
      outcome: 'failure',
      error,
    });
  });
});
