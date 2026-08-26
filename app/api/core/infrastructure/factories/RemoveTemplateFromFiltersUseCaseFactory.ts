import { RemoveTemplateFromFiltersUseCase } from '#api/core/application/RemoveTemplateFromFilters.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { SaveSettingsUseCaseFactory } from './SaveSettingsUseCaseFactory.js';

class RemoveTemplateFromFiltersUseCaseFactory {
  static default(): RemoveTemplateFromFiltersUseCase {
    const transactionManager = TransactionManagerFactory.default();
    return new RemoveTemplateFromFiltersUseCase({
      transactionManager,
      settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      saveSettings: SaveSettingsUseCaseFactory.default(),
    });
  }
}

export { RemoveTemplateFromFiltersUseCaseFactory };
