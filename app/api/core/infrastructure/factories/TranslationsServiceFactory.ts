import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { ValidateTranslationsService } from '#api/core/application/translation/ValidateTranslationsService.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class TranslationsServiceFactory {
  static default(
    overrides: {
      transactionManager?: TransactionManager;
    } = {}
  ) {
    const transactionManager = overrides.transactionManager ?? TransactionManagerFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

    return new TranslationsService({
      transactionManager,
      translationsDS,
      settingsDS,
      validateTranslations: new ValidateTranslationsService(translationsDS, settingsDS),
    });
  }
}
