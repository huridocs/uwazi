import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';

class GetSettingsController extends AbstractController {
  protected async handle(): Promise<void> {
    const isAdmin = this.request.user?.role === 'admin';
    const payload = await SettingsQueryServiceFactory.default().getForHttp(isAdmin);
    this.response.json(payload);
  }
}

export { GetSettingsController };
