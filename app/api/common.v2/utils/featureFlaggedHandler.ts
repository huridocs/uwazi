import { tenants } from 'api/tenants';
import { TenantFeatureFlags } from 'api/tenants/tenantContext';

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
