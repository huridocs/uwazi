import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { ValidateTranslationsService } from '#api/core/application/translation/ValidateTranslationsService.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';

export class TranslationsServiceFactory {
  static default(
    overrides: {
      transactionManager?: TransactionManager;
    } = {}
  ) {
    const transactionManager = overrides.transactionManager ?? ExecutionContext.transactionManager;
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default();

    return new TranslationsService({
      transactionManager,
      translationsDS,
      settingsDS,
      validateTranslations: new ValidateTranslationsService(translationsDS, settingsDS),
    });
  }
}
