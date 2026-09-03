import { SaveSettingsUseCase } from '#api/core/application/SaveSettings.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

class SaveSettingsUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof SaveSettingsUseCase>[0]>
  ): SaveSettingsUseCase {
    return new SaveSettingsUseCase({
      transactionManager: ExecutionContext.transactionManager,
      settingsDS: SettingsDataSourceFactory.default(),
      translationsService: TranslationsServiceFactory.default(),
      ...overrides,
    });
  }
}

export { SaveSettingsUseCaseFactory };
