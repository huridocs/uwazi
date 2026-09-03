import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';

class GetSettingsLinksController extends AbstractController {
  protected async handle(): Promise<void> {
    const settings = await SettingsQueryServiceFactory.default().forBroadcast();
    this.response.json(settings.links);
  }
}

export { GetSettingsLinksController };
