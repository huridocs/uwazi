import { SaveSettingsInputSchema } from '#api/core/application/settings/saveSettingsInput.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { SettingsOutput } from '../contracts.js';
import type { UpdateSettingsCliInput } from '../controllers/UpdateSettingsController.js';

class UpdateSettingsRoute implements Route<UpdateSettingsCliInput, SettingsOutput> {
  readonly group = 'settings';

  readonly name = 'update';

  readonly describe = 'Change settings; top-level fields sent replace the stored ones';

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  /** The save use case's own input schema, so --schema documents exactly what it accepts. */
  readonly request = SaveSettingsInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/UpdateSettingsController.js')
  );

  async handle(input: UpdateSettingsCliInput): Promise<SettingsOutput> {
    const { UpdateSettingsController } = await this.controller.get();
    return UpdateSettingsController.handle(input);
  }
}

export { UpdateSettingsRoute };
