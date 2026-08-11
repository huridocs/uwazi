import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveTranslationEntriesUseCaseFactory } from '#api/core/infrastructure/factories/SaveTranslationEntriesUseCaseFactory.js';

class SaveTranslationEntriesController extends AbstractController {
  protected async handle(): Promise<void> {
    await SaveTranslationEntriesUseCaseFactory.default().execute({
      translations: this.request.body,
    });
    this.request.sockets.emitToCurrentTenant('translationKeysChange', this.request.body);
    this.response.status(200);
    this.response.json({ success: true });
  }
}

export { SaveTranslationEntriesController };
