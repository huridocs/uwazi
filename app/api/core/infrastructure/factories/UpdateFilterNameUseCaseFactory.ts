import { UpdateFilterNameUseCase } from '#api/core/application/UpdateFilterName.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { SaveSettingsUseCaseFactory } from './SaveSettingsUseCaseFactory.js';

class UpdateFilterNameUseCaseFactory {
  static default(): UpdateFilterNameUseCase {
    const transactionManager = TransactionManagerFactory.default();
    return new UpdateFilterNameUseCase({
      transactionManager,
      settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      saveSettings: SaveSettingsUseCaseFactory.default(),
    });
  }
}

export { UpdateFilterNameUseCaseFactory };
