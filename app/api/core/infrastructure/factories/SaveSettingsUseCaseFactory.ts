import { SaveSettingsUseCase } from '#api/core/application/SaveSettings.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { SettingsServiceFactory } from './SettingsServiceFactory.js';

class SaveSettingsUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof SaveSettingsUseCase>[0]>
  ): SaveSettingsUseCase {
    return new SaveSettingsUseCase({
      transactionManager: ExecutionContext.transactionManager,
      settingsDS: SettingsDataSourceFactory.default(),
      settingsService: SettingsServiceFactory.default(),
      ...overrides,
    });
  }
}

export { SaveSettingsUseCaseFactory };
