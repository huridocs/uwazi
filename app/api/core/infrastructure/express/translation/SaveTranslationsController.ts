import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import translations from '#api/i18n/translations.js';

class SaveTranslationsController extends AbstractController {
  protected async handle(): Promise<void> {
    const { locale } = await translations.save(this.request.body);
    const [response] = await translations.get({ locale });
    this.request.sockets.emitToCurrentTenant('translationsChange', response);
    this.response.json(response);
  }
}

export { SaveTranslationsController };
