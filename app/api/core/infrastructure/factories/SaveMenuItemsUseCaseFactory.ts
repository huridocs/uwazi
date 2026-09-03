import { SaveMenuItemsUseCase } from '#api/core/application/SaveMenuItems.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SaveSettingsUseCaseFactory } from './SaveSettingsUseCaseFactory.js';

class SaveMenuItemsUseCaseFactory {
  static default(): SaveMenuItemsUseCase {
    return new SaveMenuItemsUseCase({
      transactionManager: ExecutionContext.transactionManager,
      saveSettings: SaveSettingsUseCaseFactory.default(),
    });
  }
}

export { SaveMenuItemsUseCaseFactory };
