import { SetDefaultLanguageUseCase } from '#api/core/application/SetDefaultLanguage.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

class SetDefaultLanguageUseCaseFactory {
  static default(): SetDefaultLanguageUseCase {
    return new SetDefaultLanguageUseCase({
      transactionManager: ExecutionContext.transactionManager,
      settingsDS: SettingsDataSourceFactory.default(),
    });
  }
}

export { SetDefaultLanguageUseCaseFactory };
