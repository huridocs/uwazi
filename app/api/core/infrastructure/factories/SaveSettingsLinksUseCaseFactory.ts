import { SaveSettingsLinksUseCase } from '#api/core/application/SaveSettingsLinks.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { SaveSettingsUseCaseFactory } from './SaveSettingsUseCaseFactory.js';

class SaveSettingsLinksUseCaseFactory {
  static default(): SaveSettingsLinksUseCase {
    return new SaveSettingsLinksUseCase({
      transactionManager: TransactionManagerFactory.default(),
      saveSettings: SaveSettingsUseCaseFactory.default(),
    });
  }
}

export { SaveSettingsLinksUseCaseFactory };
