import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantsOutput } from '../contracts.js';

/** The empty request is still parsed, so an unexpected field is rejected. */
class ListTenantsRoute implements Route<Record<string, never>, TenantsOutput> {
  readonly group = 'tenants';

  readonly name = 'list';

  readonly describe = 'List every registered tenant, as stored';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  readonly request = z.object({}).strict();

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/ListTenantsController.js')
  );

  async handle(): Promise<TenantsOutput> {
    const { ListTenantsController } = await this.controller.get();
    return ListTenantsController.handle();
  }
}

export { ListTenantsRoute };
