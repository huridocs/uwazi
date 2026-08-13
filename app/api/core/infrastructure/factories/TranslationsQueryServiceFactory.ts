import { TranslationsQueryService } from '#api/core/application/translation/TranslationsQueryService.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

type Options = {
  cached?: boolean;
};

export class TranslationsQueryServiceFactory {
  static default(options?: Options) {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = options?.cached
      ? TranslationsDataSourceFactory.cached({ transactionManager })
      : TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

    return new TranslationsQueryService(translationsDS, settingsDS);
  }
}
