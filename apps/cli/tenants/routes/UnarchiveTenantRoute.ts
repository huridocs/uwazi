import {
  TenantNameInputSchema,
  type TenantNameInput,
} from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

class UnarchiveTenantRoute implements Route<TenantNameInput, TenantOutput> {
  readonly command = ['tenants', 'unarchive'];

  readonly describe = 'Move a tenant from the archived registry back to the active registry';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  readonly request = TenantNameInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/UnarchiveTenantController.js')
  );

  async handle(input: TenantNameInput): Promise<TenantOutput> {
    const { UnarchiveTenantController } = await this.controller.get();
    return UnarchiveTenantController.handle(input);
  }
}

export { UnarchiveTenantRoute };
