import { CreateTranslationEntriesUseCase } from '#api/core/application/CreateTranslationEntries.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class CreateTranslationEntriesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new CreateTranslationEntriesUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
    });
  }
}
