import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import translations from '#api/i18n/translations.js';

/**
 * Compatibility mutation for mammoth POST `/api/translations`.
 * Delegates to the façade save path (upsert branch + thesaurus metadata propagation)
 * until those side effects are fully extracted into use cases.
 */
class SaveTranslationsController extends AbstractController {
  protected async handle(): Promise<void> {
    const { locale } = await translations.save(this.request.body);
    const [response] = await translations.get({ locale });
    this.request.sockets.emitToCurrentTenant('translationsChange', response);
    this.response.json(response);
  }
}

export { SaveTranslationsController };
