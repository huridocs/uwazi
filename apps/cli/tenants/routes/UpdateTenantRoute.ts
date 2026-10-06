import { UpdateTenantInputSchema } from '#api/tenants/application/tenantInputs.js';
import type { UpdateTenantInput } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

class UpdateTenantRoute implements Route<UpdateTenantInput, TenantOutput> {
  readonly group = 'tenants';

  readonly name = 'update';

  readonly describe = 'Change a tenant; omitted fields stay, null removes';

  readonly tenancy = 'none';

  readonly needs = { redis: false, elasticsearch: false };

  readonly request = UpdateTenantInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/UpdateTenantController.js')
  );

  async handle(input: UpdateTenantInput): Promise<TenantOutput> {
    const { UpdateTenantController } = await this.controller.get();
    return UpdateTenantController.handle(input);
  }
}

export { UpdateTenantRoute };
