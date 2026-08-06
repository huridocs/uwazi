import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveTranslationEntriesServiceFactory } from '#api/core/infrastructure/factories/SaveTranslationEntriesServiceFactory.js';

class SaveTranslationEntriesController extends AbstractController {
  protected async handle(): Promise<void> {
    await SaveTranslationEntriesServiceFactory.default().execute(this.request.body);
    this.request.sockets.emitToCurrentTenant('translationKeysChange', this.request.body);
    this.response.status(200);
    this.response.json({ success: true });
  }
}

export { SaveTranslationEntriesController };
