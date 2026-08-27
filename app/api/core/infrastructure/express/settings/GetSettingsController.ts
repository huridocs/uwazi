import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';

class GetSettingsController extends AbstractController {
  protected async handle(): Promise<void> {
    const query = SettingsQueryServiceFactory.default();
    const payload =
      this.request.user?.role === 'admin' ? await query.getForAdmin() : await query.getPublic();
    this.response.json(payload);
  }
}

export { GetSettingsController };
