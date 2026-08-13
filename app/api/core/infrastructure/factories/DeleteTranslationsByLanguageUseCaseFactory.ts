import { DeleteTranslationsByLanguageUseCase } from '#api/core/application/DeleteTranslationsByLanguage.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class DeleteTranslationsByLanguageUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new DeleteTranslationsByLanguageUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
    });
  }
}
