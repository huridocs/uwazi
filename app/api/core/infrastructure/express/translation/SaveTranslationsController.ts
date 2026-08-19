import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveLocaleTranslationsUseCaseFactory } from '#api/core/infrastructure/factories/SaveLocaleTranslationsUseCaseFactory.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

class SaveTranslationsController extends AbstractController {
  protected async handle(): Promise<void> {
    const { locale } = await SaveLocaleTranslationsUseCaseFactory.default().execute(
      this.request.body
    );
    const [response] = await TranslationsQueryServiceFactory.default().getLegacy({
      locale: locale as LanguageISO6391,
    });
    this.request.sockets.emitToCurrentTenant('translationsChange', response);
    this.response.json(response);
  }
}

export { SaveTranslationsController };
