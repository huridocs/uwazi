import { UpdateFilterNameUseCase } from '#api/core/application/UpdateFilterName.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { SaveSettingsUseCaseFactory } from './SaveSettingsUseCaseFactory.js';

class UpdateFilterNameUseCaseFactory {
  static default(): UpdateFilterNameUseCase {
    return new UpdateFilterNameUseCase({
      transactionManager: ExecutionContext.transactionManager,
      settingsDS: SettingsDataSourceFactory.default(),
      saveSettings: SaveSettingsUseCaseFactory.default(),
    });
  }
}

export { UpdateFilterNameUseCaseFactory };
