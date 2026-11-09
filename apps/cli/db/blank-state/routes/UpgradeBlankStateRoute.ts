import { z } from 'zod';
import { LazyModule } from '../../../routing/LazyModule.js';
import type { Route } from '../../../routing/Route.js';
import type { BlankStateUpgradeOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class UpgradeBlankStateRoute implements Route<NoInput, BlankStateUpgradeOutput> {
  readonly command = ['db', 'blank-state', 'upgrade'];

  readonly describe =
    'Upgrade the blank-state dump file to the latest PostgreSQL schema, in a scratch database';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true, scratchDatabase: true };

  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/UpgradeBlankStateController.js')
  );

  async handle(): Promise<BlankStateUpgradeOutput> {
    const { UpgradeBlankStateController } = await this.controller.get();
    return UpgradeBlankStateController.handle();
  }
}

export { UpgradeBlankStateRoute };
