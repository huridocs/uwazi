import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { SaveSettingsUseCase } from '#api/core/application/SaveSettings.js';
import { getPublicSettingsPayload } from '#api/core/application/settings/publicSettings.js';

class SaveSettingsController extends AbstractController {
  protected async handle(): Promise<void> {
    const input = SaveSettingsUseCase.InputSchema.parse(this.request.body);
    const saved = await SaveSettingsUseCaseFactory.default().execute(input);
    this.request.sockets.emitToCurrentTenant('updateSettings', getPublicSettingsPayload(saved));
    this.response.json(saved);
  }
}

export { SaveSettingsController };
