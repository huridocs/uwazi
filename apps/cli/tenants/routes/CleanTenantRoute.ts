import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { CleanTenantOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class CleanTenantRoute implements Route<NoInput, CleanTenantOutput> {
  readonly group = 'tenants';

  readonly name = 'clean';

  readonly describe = "Delete every row of a tenant's PostgreSQL data, keeping the registry row";

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true };

  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/CleanTenantController.js')
  );

  async handle(): Promise<CleanTenantOutput> {
    const { CleanTenantController } = await this.controller.get();
    return CleanTenantController.handle();
  }
}

export { CleanTenantRoute };
