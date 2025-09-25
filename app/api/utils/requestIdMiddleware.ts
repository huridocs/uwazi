import { Request, Response, NextFunction } from 'express';
import { appContext } from 'app/utils/AppContext.js';

const requestIdMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  appContext.set('requestId', Math.floor(Math.random() * 10000));
  next();
};

export { requestIdMiddleware };
