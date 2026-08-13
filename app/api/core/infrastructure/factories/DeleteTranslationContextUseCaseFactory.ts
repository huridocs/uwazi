import { DeleteTranslationContextUseCase } from '#api/core/application/DeleteTranslationContext.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class DeleteTranslationContextUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new DeleteTranslationContextUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
    });
  }
}
