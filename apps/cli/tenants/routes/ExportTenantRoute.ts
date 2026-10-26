import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

/** The COPY stream goes straight to stdout, so there is no result to present. */
class ExportTenantRoute implements Route<NoInput, void> {
  readonly group = 'tenants';

  readonly name = 'export';

  readonly describe = "Stream a tenant's PostgreSQL data to stdout as a portable COPY stream";

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true };

  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/ExportTenantController.js')
  );

  async handle(): Promise<void> {
    const { ExportTenantController } = await this.controller.get();
    await ExportTenantController.handle();
  }
}

export { ExportTenantRoute };
