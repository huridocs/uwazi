import { SaveTranslationEntriesService } from '#api/core/application/translation/SaveTranslationEntriesService.js';
import { CreateTranslationEntriesUseCaseFactory } from './CreateTranslationEntriesUseCaseFactory.js';
import { UpdateTranslationEntriesUseCaseFactory } from './UpdateTranslationEntriesUseCaseFactory.js';
import { TranslationsQueryServiceFactory } from './TranslationsQueryServiceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { PropagateThesaurusTranslationServiceFactory } from './PropagateThesaurusTranslationServiceFactory.js';

export class SaveTranslationEntriesServiceFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new SaveTranslationEntriesService({
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
      query: TranslationsQueryServiceFactory.default(),
      createTranslationEntries: CreateTranslationEntriesUseCaseFactory.default(),
      updateTranslationEntries: UpdateTranslationEntriesUseCaseFactory.default(),
      propagateThesaurusTranslation: PropagateThesaurusTranslationServiceFactory.default(),
    });
  }
}
