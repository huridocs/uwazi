import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { getPublicSettingsPayload } from '#api/core/application/settings/publicSettings.js';
import { Settings } from '#shared/types/settingsType.js';

class SaveSettingsController extends AbstractController {
  protected async handle(): Promise<void> {
    const saved = await SaveSettingsUseCaseFactory.default().execute(this.request.body as Settings);
    this.request.sockets.emitToCurrentTenant('updateSettings', getPublicSettingsPayload(saved));
    this.response.json(saved);
  }
}

export { SaveSettingsController };
