import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SaveTranslationEntriesUseCaseFactory } from '#api/core/infrastructure/factories/SaveTranslationEntriesUseCaseFactory.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type TranslationEntryBody = {
  language: LanguageISO6391;
  key: string;
  value: string;
  context: Translation['context'];
};

class SaveTranslationEntriesController extends AbstractController {
  protected async handle(): Promise<void> {
    const translations = (this.request.body as TranslationEntryBody[]).map(
      entry => new Translation(entry.key, entry.value, entry.language, entry.context)
    );
    await SaveTranslationEntriesUseCaseFactory.default().execute({ translations });
    this.request.sockets.emitToCurrentTenant('translationKeysChange', this.request.body);
    this.response.status(200);
    this.response.json({ success: true });
  }
}

export { SaveTranslationEntriesController };
