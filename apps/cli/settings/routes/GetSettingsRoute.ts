import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { SettingsOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class GetSettingsRoute implements Route<NoInput, SettingsOutput> {
  readonly group = 'settings';

  readonly name = 'get';

  readonly describe = "Print a tenant's whole settings document, sync included";

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/GetSettingsController.js')
  );

  async handle(): Promise<SettingsOutput> {
    const { GetSettingsController } = await this.controller.get();
    return GetSettingsController.handle();
  }
}

export { GetSettingsRoute };
