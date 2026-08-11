import { CreateTranslationContextUseCase } from '#api/core/application/CreateTranslationContext.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class CreateTranslationContextUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new CreateTranslationContextUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
    });
  }
}
