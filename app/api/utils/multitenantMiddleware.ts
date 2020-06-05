import { Request, Response, NextFunction } from 'express';
import { tenants } from 'api/tenants/tenantContext';

const multitenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  tenants
    .run(async () => {
      next();
    }, req.get('tenant'))
    .catch(next);
};

export { multitenantMiddleware };
