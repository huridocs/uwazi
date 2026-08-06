import { CreateTranslationEntriesUseCase } from '#api/core/application/CreateTranslationEntries.js';
import { ValidateTranslationsService } from '#api/core/application/translation/ValidateTranslationsService.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class CreateTranslationEntriesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

    return new CreateTranslationEntriesUseCase({
      transactionManager,
      translationsDS,
      validateTranslations: new ValidateTranslationsService(translationsDS, settingsDS),
    });
  }
}
