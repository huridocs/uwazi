import { SaveLocaleTranslationsUseCase } from '#api/core/application/SaveLocaleTranslations.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PropagateThesaurusTranslationServiceFactory } from './PropagateThesaurusTranslationServiceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

export class SaveLocaleTranslationsUseCaseFactory {
  static default() {
    const { transactionManager } = ExecutionContext;

    return new SaveLocaleTranslationsUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
      propagateThesaurusTranslation: PropagateThesaurusTranslationServiceFactory.default(),
    });
  }
}
