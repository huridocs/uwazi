import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { LanguageDoesNotExist } from '../errors/translationErrors';
import { Translation } from '../model/Translation';
import { CreateTranslationsData } from './CreateTranslationsService';

export class UpsertTranslationsService {
  private translationsDS: TranslationsDataSource;

  private settingsDS: SettingsDataSource;

  private transactionManager: TransactionManager;

  constructor(
    translationsDS: TranslationsDataSource,
    settingsDS: SettingsDataSource,
    transactionManager: TransactionManager
  ) {
    this.translationsDS = translationsDS;
    this.settingsDS = settingsDS;
    this.transactionManager = transactionManager;
  }

  async upsert(translations: CreateTranslationsData[]) {
    const allowedLanguageKeys = await this.settingsDS.getLanguageKeys();
    const difference = translations
      .map(t => t.language)
      .filter(key => !allowedLanguageKeys.includes(key));
    if (difference.length) {
      throw new LanguageDoesNotExist(JSON.stringify(difference));
    }
    return this.transactionManager.run(async () =>
      this.translationsDS.upsert(
        translations.map(
          translation =>
            new Translation(
              translation.key,
              translation.value,
              translation.language,
              translation.context
            )
        )
      )
    );
  }
}
