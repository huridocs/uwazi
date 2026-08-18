import { TranslationsQueryService } from '#api/core/application/translation/TranslationsQueryService.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class TranslationsQueryServiceFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

    return new TranslationsQueryService(translationsDS, settingsDS);
  }
}
