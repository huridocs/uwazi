import type { Response } from 'express';
import { ssrQueryCleanupMiddleware } from '../ssrQueryCleanupMiddleware.js';

describe('ssrQueryCleanupMiddleware', () => {
  it('should remove the ssr query param before the next middleware', () => {
    const next = jest.fn();
    const req = {
      query: {
        ssr: 'true',
        limit: '10',
        filter: '{"published":true}',
      },
    };

    // @ts-expect-error test double
    ssrQueryCleanupMiddleware(req, {} as Response, next);

    expect(req.query).toEqual({
      limit: '10',
      filter: '{"published":true}',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should leave the query intact when ssr is not present', () => {
    const next = jest.fn();
    const req = {
      query: {
        limit: '10',
      },
    };

    // @ts-expect-error test double
    ssrQueryCleanupMiddleware(req, {} as Response, next);

    expect(req.query).toEqual({
      limit: '10',
    });
    expect(next).toHaveBeenCalled();
  });
});
