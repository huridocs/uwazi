import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { SaveSettingsUseCase } from '#api/core/application/SaveSettings.js';

class SaveSettingsController extends AbstractController {
  protected async handle(): Promise<void> {
    const input = SaveSettingsUseCase.InputSchema.parse(this.request.body);
    const saved = await SaveSettingsUseCaseFactory.default().execute(input);
    this.response.json(saved);
  }
}

export { SaveSettingsController };
