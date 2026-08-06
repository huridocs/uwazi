import { CreateTranslationContextUseCase } from '#api/core/application/CreateTranslationContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class CreateTranslationContextUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

    return new CreateTranslationContextUseCase({
      transactionManager,
      translationsDS,
      settingsDS,
    });
  }
}
