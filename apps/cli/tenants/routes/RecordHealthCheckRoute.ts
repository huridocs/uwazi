import { RecordHealthCheckInputSchema } from '#api/tenants/application/tenantInputs.js';
import type { RecordHealthCheckInput } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

class RecordHealthCheckRoute implements Route<RecordHealthCheckInput, TenantOutput> {
  readonly group = 'tenants';

  readonly name = 'health-check';

  readonly describe = 'Store the latest health check for a tenant';

  readonly tenancy = 'none';

  readonly needs = { redis: false };

  readonly request = RecordHealthCheckInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/RecordHealthCheckController.js')
  );

  async handle(input: RecordHealthCheckInput): Promise<TenantOutput> {
    const { RecordHealthCheckController } = await this.controller.get();
    return RecordHealthCheckController.handle(input);
  }
}

export { RecordHealthCheckRoute };
