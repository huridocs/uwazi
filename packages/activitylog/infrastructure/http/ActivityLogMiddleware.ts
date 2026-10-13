import type { NextFunction, Request, Response } from 'express';
import { handleError } from '#api/utils/index.js';
import type { RecordActivityInput } from '../../application/RecordActivity.js';
import { RecordActivityFactory } from '../factories/RecordActivityFactory.js';

/**
 * Logs every request once it has been answered. The request never waits for its entry and never
 * fails because of it: an entry that cannot be stored is reported and dropped.
 */
class ActivityLogMiddleware {
  /** A request can reach the middleware more than once; it is logged the first time only. */
  private static readonly attached = new WeakSet<Request>();

  static handle(this: void, req: Request, res: Response, next: NextFunction): void {
    if (!ActivityLogMiddleware.attached.has(req)) {
      ActivityLogMiddleware.attached.add(req);
      res.on('finish', () => {
        ActivityLogMiddleware.record(req, res);
      });
    }

    next();
  }

  private static record(req: Request, res: Response): void {
    try {
      RecordActivityFactory.default()
        .execute(ActivityLogMiddleware.toInput(req, res))
        .catch((e: unknown) => {
          handleError(e, { req });
        });
    } catch (e) {
      handleError(e, { req });
    }
  }

  private static toInput(req: Request, res: Response): RecordActivityInput {
    const user = req.user as Request['user'] | undefined;

    return {
      method: req.method,
      url: req.url.split('?')[0],
      params: req.params,
      query: req.query,
      body: (req.body ?? {}) as Record<string, unknown>,
      user: user ? { id: String(user._id), username: user.username ?? null } : null,
      statusCode: res.statusCode,
    };
  }
}

export { ActivityLogMiddleware };
