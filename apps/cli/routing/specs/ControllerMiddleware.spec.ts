import { z } from 'zod';
import { CliContext } from '../../pipeline/CliContext.js';
import { ControllerMiddleware } from '../ControllerMiddleware.js';
import { Route } from '../Route.js';

const route = (handle: Route['handle']): Route => ({
  group: 'things',
  name: 'list',
  describe: 'List things',
  tenancy: 'none',
  needs: { redis: false },
  request: z.object({}),
  fieldMap: {},
  handle,
});

describe('ControllerMiddleware', () => {
  it('should call the route with the context input and store its result', async () => {
    const handle = jest.fn().mockResolvedValue([{ id: 1 }]);
    const context: CliContext = { route: 'things list', input: { tenant: 'a' }, json: false };
    const next = jest.fn().mockResolvedValue(undefined);

    await new ControllerMiddleware(route(handle)).handle(context, next);

    expect(handle).toHaveBeenCalledWith({ tenant: 'a' });
    expect(context.result).toEqual([{ id: 1 }]);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should let route errors propagate', async () => {
    const context: CliContext = { route: 'things list', input: {}, json: false };

    await expect(
      new ControllerMiddleware(route(jest.fn().mockRejectedValue(new Error('boom')))).handle(
        context,
        jest.fn()
      )
    ).rejects.toThrow('boom');
  });
});
