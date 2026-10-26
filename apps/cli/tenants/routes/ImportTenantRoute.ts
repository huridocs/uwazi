import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { ImportTenantOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class ImportTenantRoute implements Route<NoInput, ImportTenantOutput> {
  readonly group = 'tenants';

  readonly name = 'import';

  readonly describe = 'Load a COPY stream from stdin into a tenant, rewriting tenant_id';

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true };

  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/ImportTenantController.js')
  );

  async handle(): Promise<ImportTenantOutput> {
    const { ImportTenantController } = await this.controller.get();
    return ImportTenantController.handle();
  }
}

export { ImportTenantRoute };
