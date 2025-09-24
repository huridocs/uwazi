// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
// @ts-expect-error TS(2307): Cannot find module '../tenants/tenantContext.js' o... Remove this comment to see the full error message
import { TenantFeatureFlags } from '../tenants/tenantContext.js';

async function withFeatureFlag<T>(
  flagKey: TenantFeatureFlags,
  callback: () => Promise<T>
): Promise<T | void> {
  const flags = tenants.current().featureFlags;

  if (!flags?.[flagKey]) {
    return undefined;
  }

  return callback();
}

export function featureFlaggedHandler<T extends (...args: any[]) => Promise<void>>(
  flag: TenantFeatureFlags,
  handler: T
): (...args: Parameters<T>) => Promise<void> {
  return async (...args: Parameters<T>) => {
    await withFeatureFlag(flag, async () => {
      await handler(...args);
    });
  };
}
