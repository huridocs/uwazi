import { DeleteTranslationContextUseCase } from '#api/core/application/DeleteTranslationContext.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class DeleteTranslationContextUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });

    return new DeleteTranslationContextUseCase({
      transactionManager,
      translationsDS,
    });
  }
}
