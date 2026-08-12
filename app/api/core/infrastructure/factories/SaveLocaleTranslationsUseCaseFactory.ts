import { SaveLocaleTranslationsUseCase } from '#api/core/application/SaveLocaleTranslations.js';
import { PropagateThesaurusTranslationServiceFactory } from './PropagateThesaurusTranslationServiceFactory.js';
import { TranslationsQueryServiceFactory } from './TranslationsQueryServiceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class SaveLocaleTranslationsUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new SaveLocaleTranslationsUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      query: TranslationsQueryServiceFactory.default(),
      propagateThesaurusTranslation: PropagateThesaurusTranslationServiceFactory.default(),
    });
  }
}
