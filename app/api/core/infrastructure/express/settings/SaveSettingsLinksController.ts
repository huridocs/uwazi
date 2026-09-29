import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { SaveMenuItemsInputSchema } from '#api/core/application/settings/saveSettingsInput.js';

class SaveSettingsLinksController extends AbstractController {
  protected async handle(): Promise<void> {
    const { links } = SaveMenuItemsInputSchema.parse({ links: this.request.body });
    await SaveSettingsUseCaseFactory.default().execute({ links });
    const payload = await SettingsQueryServiceFactory.default().get();
    this.response.json(payload);
  }
}

export { SaveSettingsLinksController };
