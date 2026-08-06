import { SaveLocaleTranslationsService } from '#api/core/application/translation/SaveLocaleTranslationsService.js';
import { createTranslationMutationDeps } from './translationMutationWiring.js';

export class SaveLocaleTranslationsServiceFactory {
  static default() {
    const deps = createTranslationMutationDeps();

    return new SaveLocaleTranslationsService({
      transactionManager: deps.transactionManager,
      translationsDS: deps.translationsDS,
      query: deps.query,
      createTranslationEntries: deps.createTranslationEntries,
      updateTranslationEntries: deps.updateTranslationEntries,
      propagateThesaurusTranslation: deps.propagateThesaurusTranslation,
    });
  }
}
