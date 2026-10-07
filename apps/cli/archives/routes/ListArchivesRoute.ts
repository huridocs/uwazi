import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { ArchivesOutput } from '../contracts.js';

/** The empty request is still parsed, so an unexpected field is rejected. */
class ListArchivesRoute implements Route<Record<string, never>, ArchivesOutput> {
  readonly group = 'archives';

  readonly name = 'list';

  readonly describe = 'List the archived tenants, as stored, newest first';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  readonly request = z.object({}).strict();

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/ListArchivesController.js')
  );

  async handle(): Promise<ArchivesOutput> {
    const { ListArchivesController } = await this.controller.get();
    return ListArchivesController.handle();
  }
}

export { ListArchivesRoute };
