import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveMenuItemsUseCaseFactory } from '#api/core/infrastructure/factories/SaveMenuItemsUseCaseFactory.js';
import { SaveMenuItemsUseCase } from '#api/core/application/SaveMenuItems.js';
import { getPublicSettingsPayload } from '#api/core/application/settings/publicSettings.js';

class SaveSettingsLinksController extends AbstractController {
  protected async handle(): Promise<void> {
    const { links } = SaveMenuItemsUseCase.InputSchema.parse({ links: this.request.body });
    const saved = await SaveMenuItemsUseCaseFactory.default().execute({ links });
    this.request.sockets.emitToCurrentTenant('updateSettings', getPublicSettingsPayload(saved));
    this.response.json(saved);
  }
}

export { SaveSettingsLinksController };
