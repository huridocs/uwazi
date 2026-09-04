import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { SaveMenuItemsInputSchema } from '#api/core/application/settings/saveSettingsInput.js';

class SaveSettingsLinksController extends AbstractController {
  protected async handle(): Promise<void> {
    const { links } = SaveMenuItemsInputSchema.parse({ links: this.request.body });
    const saved = await SaveSettingsUseCaseFactory.default().execute({ links });
    this.response.json(saved);
  }
}

export { SaveSettingsLinksController };
