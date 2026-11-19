import { tenants } from '#api/tenants/index.js';
import type { TenantFeatureFlags } from '#api/tenants/tenantContext.js';

import { guardHandle } from './guardHandle.js';

/** Controller counterpart of `featureFlagEnabled` (app/api/utils/featureFlagEnabledMiddleware.ts). */
export function RequireFeatureFlag(flag: TenantFeatureFlags) {
  return guardHandle(() => {
    if (tenants.current().featureFlags?.[flag]) {
      return undefined;
    }

    return { status: 403, body: { error: 'Feature not available' } };
  });
}
