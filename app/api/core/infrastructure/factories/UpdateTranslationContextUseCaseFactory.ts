import { UpdateTranslationContextUseCase } from '#api/core/application/UpdateTranslationContext.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class UpdateTranslationContextUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new UpdateTranslationContextUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
    });
  }
}
