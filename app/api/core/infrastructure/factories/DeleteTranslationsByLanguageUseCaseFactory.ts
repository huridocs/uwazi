import { DeleteTranslationsByLanguageUseCase } from '#api/core/application/DeleteTranslationsByLanguage.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class DeleteTranslationsByLanguageUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });

    return new DeleteTranslationsByLanguageUseCase({
      transactionManager,
      translationsDS,
    });
  }
}
