import { SetMaintenanceInputSchema } from '#api/tenants/application/tenantInputs.js';
import type { SetMaintenanceInput } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

class SetMaintenanceRoute implements Route<SetMaintenanceInput, TenantOutput> {
  readonly group = 'tenants';

  readonly name = 'maintenance';

  readonly describe = 'Put a tenant under maintenance, or take it out';

  readonly tenancy = 'none';

  readonly needs = { redis: false };

  readonly request = SetMaintenanceInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/SetMaintenanceController.js')
  );

  async handle(input: SetMaintenanceInput): Promise<TenantOutput> {
    const { SetMaintenanceController } = await this.controller.get();
    return SetMaintenanceController.handle(input);
  }
}

export { SetMaintenanceRoute };
