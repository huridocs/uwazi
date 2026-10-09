import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { previewThemeCustomization } from '#app/utils/v2Preview.js';

class GetSettingsController extends AbstractController {
  protected async handle(): Promise<void> {
    const payload = await SettingsQueryServiceFactory.default().get();
    const themeCustomization = previewThemeCustomization(payload.themeCustomization, {
      search: '',
      cookieHeader: this.request.headers.cookie,
    });
    this.response.json({ ...payload, themeCustomization });
  }
}

export { GetSettingsController };
