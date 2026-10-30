import { z } from 'zod';
import { LazyModule } from '../../../routing/LazyModule.js';
import type { Route } from '../../../routing/Route.js';
import type { BlankStateDumpOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class DumpBlankStateRoute implements Route<NoInput, BlankStateDumpOutput> {
  readonly command = ['db', 'blank-state', 'dump'];

  readonly describe = "Dump a tenant's PostgreSQL data to the blank-state dump file";

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true };

  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/DumpBlankStateController.js')
  );

  async handle(): Promise<BlankStateDumpOutput> {
    const { DumpBlankStateController } = await this.controller.get();
    return DumpBlankStateController.handle();
  }
}

export { DumpBlankStateRoute };
