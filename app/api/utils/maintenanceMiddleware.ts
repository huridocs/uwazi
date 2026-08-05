import type { Request, Response, NextFunction } from 'express';
import { tenants } from '#api/tenants/tenantContext.js';

const maintenanceMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  if (tenants.current().maintenance) {
    return res.status(503).json({ error: 'Service Unavailable', maintenance: true });
  }
  next();
};

export { maintenanceMiddleware };
