import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SetDefaultLanguageUseCaseFactory } from '#api/core/infrastructure/factories/SetDefaultLanguageUseCaseFactory.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';

class SetDefaultLanguageController extends AbstractController {
  protected async handle(): Promise<void> {
    await SetDefaultLanguageUseCaseFactory.default().execute({
      key: this.request.body.key,
    });
    const payload = await SettingsQueryServiceFactory.default().get();
    this.response.json(payload);
  }
}

export { SetDefaultLanguageController };
