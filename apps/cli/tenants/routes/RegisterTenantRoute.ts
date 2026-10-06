import { RegisterTenantInputSchema } from '#api/tenants/application/tenantInputs.js';
import type { RegisterTenantInput } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

class RegisterTenantRoute implements Route<RegisterTenantInput, TenantOutput> {
  readonly group = 'tenants';

  readonly name = 'register';

  readonly describe = 'Register a tenant, or update the one already registered';

  readonly tenancy = 'none';

  readonly needs = { redis: false, elasticsearch: false };

  readonly request = RegisterTenantInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/RegisterTenantController.js')
  );

  async handle(input: RegisterTenantInput): Promise<TenantOutput> {
    const { RegisterTenantController } = await this.controller.get();
    return RegisterTenantController.handle(input);
  }
}

export { RegisterTenantRoute };
