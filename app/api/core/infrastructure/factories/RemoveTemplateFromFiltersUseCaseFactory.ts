import { RemoveTemplateFromFiltersUseCase } from '#api/core/application/RemoveTemplateFromFilters.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { SaveSettingsUseCaseFactory } from './SaveSettingsUseCaseFactory.js';

class RemoveTemplateFromFiltersUseCaseFactory {
  static default(): RemoveTemplateFromFiltersUseCase {
    return new RemoveTemplateFromFiltersUseCase({
      transactionManager: ExecutionContext.transactionManager,
      settingsDS: SettingsDataSourceFactory.default(),
      saveSettings: SaveSettingsUseCaseFactory.default(),
    });
  }
}

export { RemoveTemplateFromFiltersUseCaseFactory };
