// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
import { Request, Response, NextFunction } from 'express';
import { TenantFeatureFlags } from '../tenants/tenantContext.js';

export function featureFlagEnabled(flagKey: TenantFeatureFlags) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const isEnabled = tenants.current().featureFlags?.[flagKey];

    if (!isEnabled) {
      return res.status(403).json({ error: 'Feature not available' });
    }

    return next();
  };
}
