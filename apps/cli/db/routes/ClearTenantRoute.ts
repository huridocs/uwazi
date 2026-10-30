import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { ClearTenantOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class ClearTenantRoute implements Route<NoInput, ClearTenantOutput> {
  readonly command = ['db', 'clear'];

  readonly describe = "Delete every row of a tenant's PostgreSQL data, keeping the registry row";

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true };

  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/ClearTenantController.js')
  );

  async handle(): Promise<ClearTenantOutput> {
    const { ClearTenantController } = await this.controller.get();
    return ClearTenantController.handle();
  }
}

export { ClearTenantRoute };
