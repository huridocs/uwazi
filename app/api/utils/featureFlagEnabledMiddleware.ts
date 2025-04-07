import { tenants } from 'api/tenants';
import { Request, Response, NextFunction } from 'express';
import { TenantFeatureFlags } from 'api/tenants/tenantContext';

export function featureFlagEnabled(flagKey: TenantFeatureFlags) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const isEnabled = tenants.current().featureFlags?.[flagKey];

    if (!isEnabled) {
      return res.status(403).json({ error: 'Feature not available' });
    }

    return next();
  };
}
