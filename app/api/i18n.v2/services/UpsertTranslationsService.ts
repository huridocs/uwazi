import { TransactionManager } from '../common.v2/contracts/TransactionManager.js';

import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';
import { CreateTranslationsData } from '#api/i18n.v2/services/CreateTranslationsService.js';
import { ValidateTranslationsService } from '#api/i18n.v2/services/ValidateTranslationsService.js';

export class UpsertTranslationsService {
  private translationsDS: TranslationsDataSource;

  private settingsDS: SettingsDataSource;

  private validationService: ValidateTranslationsService;

  private transactionManager: TransactionManager;

  constructor(
    translationsDS: TranslationsDataSource,
    settingsDS: SettingsDataSource,
    validationService: ValidateTranslationsService,
    transactionManager: TransactionManager
  ) {
    this.translationsDS = translationsDS;
    this.settingsDS = settingsDS;
    this.validationService = validationService;
    this.transactionManager = transactionManager;
  }

  async upsert(translations: CreateTranslationsData[]) {
    await this.validationService.languagesExist(translations);
    await this.validationService.translationsWillExistsInAllLanguages(translations);

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

  async updateContext(
    context: CreateTranslationsData['context'],
    keyChanges: { [oldKey: string]: string },
    valueChanges: { [key: string]: string },
    keysToDelete: string[]
  ) {
    return this.transactionManager.run(async () => {
      const keysChangedReversed = Object.entries(keyChanges).reduce<{ [newKey: string]: string }>(
        (keys, [oldKey, newKey]) => {
          // eslint-disable-next-line no-param-reassign
          keys[newKey] = oldKey;
          return keys;
        },
        {}
      );

      await this.createNewKeys(keysChangedReversed, valueChanges, context);

      await this.translationsDS.updateContextLabel(context.id, context.label);

      await this.translationsDS.updateKeysByContext(context.id, keyChanges);

      await this.updateKeyValueOnDefaultLanguage(Object.values(keyChanges), context);

      await this.translationsDS.deleteKeysByContext(context.id, keysToDelete);
    });
  }

  private async updateKeyValueOnDefaultLanguage(
    newKeys: string[],
    context: CreateTranslationsData['context']
  ) {
    const defaultLanguageKey = await this.settingsDS.getDefaultLanguageKey();

    await this.translationsDS.upsert(
      newKeys.reduce<Translation[]>((memo, newKey) => {
        memo.push(new Translation(newKey, newKey, defaultLanguageKey, context));
        return memo;
      }, [])
    );
  }

  private async createNewKeys(
    keysChangedReversed: { [x: string]: string },
    valueChanges: { [key: string]: string },
    context: CreateTranslationsData['context']
  ) {
    const originalKeysGoingToChange = Object.keys(valueChanges).reduce<string[]>((keys, key) => {
      if (keysChangedReversed[key]) {
        keys.push(keysChangedReversed[key]);
      } else {
        keys.push(key);
      }
      return keys;
    }, []);

    const missingKeysInDB = await this.translationsDS.calculateNonexistentKeys(
      context.id,
      originalKeysGoingToChange
    );

    if (missingKeysInDB.length) {
      const keysChangedForward = Object.entries(keysChangedReversed).reduce<{
        [oldKey: string]: string;
      }>((keys, [newKey, oldKey]) => {
        // eslint-disable-next-line no-param-reassign
        keys[oldKey] = newKey;
        return keys;
      }, {});

      await this.translationsDS.insert(
        (await this.settingsDS.getLanguageKeys()).reduce<Translation[]>(
          (memo, languageKey) =>
            memo.concat(
              missingKeysInDB.map(key => {
                const newKey = keysChangedForward[key];
                const value = newKey ? valueChanges[newKey] : valueChanges[key];
                return new Translation(key, value, languageKey, context);
              })
            ),
          []
        )
      );
    }
  }
}
