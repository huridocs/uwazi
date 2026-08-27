import { SaveMenuItemsUseCase } from '#api/core/application/SaveMenuItems.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { SaveSettingsUseCaseFactory } from './SaveSettingsUseCaseFactory.js';

class SaveMenuItemsUseCaseFactory {
  static default(): SaveMenuItemsUseCase {
    return new SaveMenuItemsUseCase({
      transactionManager: TransactionManagerFactory.default(),
      saveSettings: SaveSettingsUseCaseFactory.default(),
    });
  }
}

export { SaveMenuItemsUseCaseFactory };
