import { TenantNameInputSchema } from '#api/tenants/application/tenantInputs.js';
import type { TenantNameInput } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';

class DeleteTenantRoute implements Route<TenantNameInput, { name: string }> {
  readonly group = 'tenants';

  readonly name = 'delete';

  readonly describe = 'Remove a tenant from the registry, leaving its data alone';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  readonly request = TenantNameInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/DeleteTenantController.js')
  );

  async handle(input: TenantNameInput): Promise<{ name: string }> {
    const { DeleteTenantController } = await this.controller.get();
    return DeleteTenantController.handle(input);
  }
}

export { DeleteTenantRoute };
