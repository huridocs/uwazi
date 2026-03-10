import { Request, Response, NextFunction } from 'express';
import { appContext } from 'api/utils/AppContext';
import { config } from 'api/config';

const multitenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  appContext.set('tenant', req.get('tenant') || config.defaultTenant.name);
  next();
};

export { multitenantMiddleware };
