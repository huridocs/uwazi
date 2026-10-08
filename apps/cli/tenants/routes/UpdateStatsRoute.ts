import { UpdateStatsInputSchema } from '#api/tenants/application/tenantInputs.js';
import type { UpdateStatsInput } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

class UpdateStatsRoute implements Route<UpdateStatsInput, TenantOutput> {
  readonly group = 'tenants';

  readonly name = 'stats';

  readonly describe = 'Store the usage figures another tool computed';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  readonly request = UpdateStatsInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/UpdateStatsController.js')
  );

  async handle(input: UpdateStatsInput): Promise<TenantOutput> {
    const { UpdateStatsController } = await this.controller.get();
    return UpdateStatsController.handle(input);
  }
}

export { UpdateStatsRoute };
