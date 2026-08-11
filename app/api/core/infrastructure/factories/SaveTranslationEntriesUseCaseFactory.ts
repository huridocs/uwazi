import { SaveTranslationEntriesUseCase } from '#api/core/application/SaveTranslationEntries.js';
import { PropagateThesaurusTranslationServiceFactory } from './PropagateThesaurusTranslationServiceFactory.js';
import { TranslationsQueryServiceFactory } from './TranslationsQueryServiceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class SaveTranslationEntriesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new SaveTranslationEntriesUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      query: TranslationsQueryServiceFactory.default(),
      propagateThesaurusTranslation: PropagateThesaurusTranslationServiceFactory.default(),
    });
  }
}
