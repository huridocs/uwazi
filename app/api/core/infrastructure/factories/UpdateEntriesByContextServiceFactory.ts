import { UpdateEntriesByContextService } from '#api/core/application/translation/UpdateEntriesByContextService.js';
import { SaveLocaleTranslationsService } from '#api/core/application/translation/SaveLocaleTranslationsService.js';
import { createTranslationMutationDeps } from './translationMutationWiring.js';

export class UpdateEntriesByContextServiceFactory {
  static default() {
    const deps = createTranslationMutationDeps();

    const saveLocaleTranslations = new SaveLocaleTranslationsService({
      transactionManager: deps.transactionManager,
      translationsDS: deps.translationsDS,
      query: deps.query,
      createTranslationEntries: deps.createTranslationEntries,
      updateTranslationEntries: deps.updateTranslationEntries,
      propagateThesaurusTranslation: deps.propagateThesaurusTranslation,
    });

    return new UpdateEntriesByContextService({
      transactionManager: deps.transactionManager,
      settingsDS: deps.settingsDS,
      query: deps.query,
      saveLocaleTranslations,
      propagateThesaurusTranslation: deps.propagateThesaurusTranslation,
    });
  }
}
