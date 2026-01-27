import type { Request, Response, NextFunction } from 'express';
import { appContext } from '#api/utils/AppContext.js';

const appContextMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  appContext
    .run(async () => {
      next();
    })
    .catch(next);
};

export { appContextMiddleware };
