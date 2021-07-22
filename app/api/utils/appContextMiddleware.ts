import { Request, Response, NextFunction } from 'express';
import { appContext } from 'api/utils/AppContext';

const appContextMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  appContext
    .run(async () => {
      appContext.set('requestId', Math.floor(Math.random() * 10000));
      next();
    })
    .catch(next);
};

export { appContextMiddleware };
