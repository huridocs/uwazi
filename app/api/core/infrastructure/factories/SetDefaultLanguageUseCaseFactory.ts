import { SetDefaultLanguageUseCase } from '#api/core/application/SetDefaultLanguage.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

class SetDefaultLanguageUseCaseFactory {
  static default(): SetDefaultLanguageUseCase {
    const transactionManager = TransactionManagerFactory.default();
    return new SetDefaultLanguageUseCase({
      transactionManager,
      settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
    });
  }
}

export { SetDefaultLanguageUseCaseFactory };
