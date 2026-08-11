import { UpdateTranslationEntriesUseCase } from '#api/core/application/UpdateTranslationEntries.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class UpdateTranslationEntriesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new UpdateTranslationEntriesUseCase({
      transactionManager,
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
    });
  }
}
