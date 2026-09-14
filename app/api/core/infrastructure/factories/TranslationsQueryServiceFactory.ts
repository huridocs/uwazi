import { TranslationsQueryService } from '#api/core/application/translation/TranslationsQueryService.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';

export class TranslationsQueryServiceFactory {
  static default() {
    const { transactionManager } = ExecutionContext;
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default();

    return new TranslationsQueryService(translationsDS, settingsDS);
  }
}
