import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveSettingsLinksUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsLinksUseCaseFactory.js';
import { getPublicSettingsPayload } from '#api/core/application/settings/publicSettings.js';
import { Settings } from '#shared/types/settingsType.js';

class SaveSettingsLinksController extends AbstractController {
  protected async handle(): Promise<void> {
    const saved = await SaveSettingsLinksUseCaseFactory.default().execute({
      links: this.request.body as NonNullable<Settings['links']>,
    });
    this.request.sockets.emitToCurrentTenant('updateSettings', getPublicSettingsPayload(saved));
    this.response.json(saved);
  }
}

export { SaveSettingsLinksController };
