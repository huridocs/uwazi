import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { LanguageDoesNotExist } from '../errors/translationErrors';
import { Translation } from '../model/Translation';

export interface CreateTranslationsData {
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: {
    type?: 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';
    label: string;
    id: string;
  };
}

export class CreateTranslationsService {
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

  async create(translations: CreateTranslationsData[]) {
    const allowedLanguageKeys = await this.settingsDS.getLanguageKeys();
    const difference = translations
      .map(t => t.language)
      .filter(key => !allowedLanguageKeys.includes(key));
    if (difference.length) {
      throw new LanguageDoesNotExist(JSON.stringify(difference));
    }
    return this.transactionManager.run(async () =>
      this.translationsDS.insert(
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
