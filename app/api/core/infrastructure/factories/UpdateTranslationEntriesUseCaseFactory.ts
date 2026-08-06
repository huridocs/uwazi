import { UpdateTranslationEntriesUseCase } from '#api/core/application/UpdateTranslationEntries.js';
import { ValidateTranslationsService } from '#api/core/application/translation/ValidateTranslationsService.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class UpdateTranslationEntriesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

    return new UpdateTranslationEntriesUseCase({
      transactionManager,
      translationsDS,
      validateTranslations: new ValidateTranslationsService(translationsDS, settingsDS),
    });
  }
}
