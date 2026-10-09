import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';

class GetSettingsController extends AbstractController {
  protected async handle(): Promise<void> {
    const payload = await SettingsQueryServiceFactory.default().get();
    this.response.json(payload);
  }
}

export { GetSettingsController };
