import { SaveTranslationEntriesUseCase } from '#api/core/application/SaveTranslationEntries.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PropagateThesaurusTranslationServiceFactory } from './PropagateThesaurusTranslationServiceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

export class SaveTranslationEntriesUseCaseFactory {
  static default() {
    const { transactionManager } = ExecutionContext;

    return new SaveTranslationEntriesUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
      propagateThesaurusTranslation: PropagateThesaurusTranslationServiceFactory.default(),
    });
  }
}
