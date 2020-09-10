import { Request, Response, NextFunction } from 'express';
import { tenants } from 'api/tenants/tenantContext';
import createError from 'api/utils/Error';
import { config } from 'api/config';

const multitenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  tenants
    .run(async () => {
      const currentTenant = tenants.current();
      if (currentTenant.unavailable) {
        throw createError('Tenant unavailable', 503);
      }
      if (currentTenant.uwaziVersion !== config.version) {
        throw createError('Tenant uwazi version and package.json version do not match', 502);
      }
      next();
    }, req.get('tenant'))
    .catch(next);
};

export { multitenantMiddleware };
