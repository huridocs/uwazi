import { Request, Response, NextFunction } from 'express';
import { appContext } from 'api/utils/AppContext';

const requestIdMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  const requestId = Math.floor(Math.random() * 10000);

  appContext.set('requestId', requestId);

  next();
};

export { requestIdMiddleware };
