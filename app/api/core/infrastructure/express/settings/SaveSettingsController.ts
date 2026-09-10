import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { SaveSettingsUseCase } from '#api/core/application/SaveSettings.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';

class SaveSettingsController extends AbstractController {
  protected async handle(): Promise<void> {
    const input = SaveSettingsUseCase.InputSchema.parse(this.request.body);
    await SaveSettingsUseCaseFactory.default().execute(input);
    const payload = await SettingsQueryServiceFactory.default().get();
    this.response.json(payload);
  }
}

export { SaveSettingsController };
