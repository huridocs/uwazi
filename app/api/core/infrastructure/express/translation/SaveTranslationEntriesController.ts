import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import translations from '#api/i18n/translations.js';

/**
 * Compatibility mutation for by-item POST `/api/v2/translations`.
 * Delegates to v2StructureSave (create/update branch + thesaurus propagation).
 */
class SaveTranslationEntriesController extends AbstractController {
  protected async handle(): Promise<void> {
    await translations.v2StructureSave(this.request.body);
    this.request.sockets.emitToCurrentTenant('translationKeysChange', this.request.body);
    this.response.status(200);
    this.response.json({ success: true });
  }
}

export { SaveTranslationEntriesController };
