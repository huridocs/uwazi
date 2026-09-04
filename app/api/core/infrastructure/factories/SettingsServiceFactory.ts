import { SettingsService } from '#api/core/application/settings/SettingsService.js';
import { SettingsTranslationService } from '#api/core/application/settings/SettingsTranslationService.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

class SettingsServiceFactory {
  static default(): SettingsService {
    return new SettingsService({
      settingsDS: SettingsDataSourceFactory.default(),
      translations: new SettingsTranslationService(TranslationsServiceFactory.default()),
      transactionManager: ExecutionContext.transactionManager,
      eventEmitter: ExecutionContext.eventEmitter,
    });
  }
}

export { SettingsServiceFactory };
