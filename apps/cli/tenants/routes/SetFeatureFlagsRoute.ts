import { SetFeatureFlagsInputSchema } from '#api/tenants/application/tenantInputs.js';
import type { SetFeatureFlagsInput } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

class SetFeatureFlagsRoute implements Route<SetFeatureFlagsInput, TenantOutput> {
  readonly group = 'tenants';

  readonly name = 'feature-flags';

  readonly describe = 'Merge feature flags; a flag sent as null is removed';

  readonly tenancy = 'none';

  readonly needs = { redis: false, elasticsearch: false };

  readonly request = SetFeatureFlagsInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/SetFeatureFlagsController.js')
  );

  async handle(input: SetFeatureFlagsInput): Promise<TenantOutput> {
    const { SetFeatureFlagsController } = await this.controller.get();
    return SetFeatureFlagsController.handle(input);
  }
}

export { SetFeatureFlagsRoute };
