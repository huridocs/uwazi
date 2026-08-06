import { UpdateTranslationContextUseCase } from '#api/core/application/UpdateTranslationContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class UpdateTranslationContextUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

    return new UpdateTranslationContextUseCase({
      transactionManager,
      translationsDS,
      settingsDS,
    });
  }
}
