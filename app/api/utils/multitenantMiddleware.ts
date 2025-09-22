import { Request, Response, NextFunction } from 'express';
import { appContext } from '../utils/AppContext.js';
import { config } from '../config.js';

const multitenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  appContext.set('tenant', req.get('tenant') || config.defaultTenant.name);
  next();
};

export { multitenantMiddleware };
