import { TenantNameInputSchema } from '#api/tenants/application/tenantInputs.js';
import type { TenantNameInput } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

class GetTenantRoute implements Route<TenantNameInput, TenantOutput> {
  readonly group = 'tenants';

  readonly name = 'get';

  readonly describe = 'Print the registry row of one tenant, as stored';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  readonly request = TenantNameInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/GetTenantController.js')
  );

  async handle(input: TenantNameInput): Promise<TenantOutput> {
    const { GetTenantController } = await this.controller.get();
    return GetTenantController.handle(input);
  }
}

export { GetTenantRoute };
