import { SaveSettingsUseCase } from '#api/core/application/SaveSettings.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

class SaveSettingsUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof SaveSettingsUseCase>[0]>
  ): SaveSettingsUseCase {
    const transactionManager = TransactionManagerFactory.default();
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const translationsService = TranslationsServiceFactory.default({ transactionManager });

    return new SaveSettingsUseCase({
      transactionManager,
      idGenerator: IdGeneratorFactory.default(),
      settingsDS,
      translationsService,
      ...overrides,
    });
  }
}

export { SaveSettingsUseCaseFactory };
