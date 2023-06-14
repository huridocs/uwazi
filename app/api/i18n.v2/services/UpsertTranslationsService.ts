import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import {
  LanguageDoesNotExist,
  TranslationMissingLanguages as TranslationsMissingLanguages,
} from '../errors/translationErrors';
import { Translation, TranslationContext } from '../model/Translation';
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

    const translationsMissingLanguages = await this.translationsDS.calculateKeysWithoutAllLanguages(
      translations
    );
    if (translationsMissingLanguages.length) {
      throw new TranslationsMissingLanguages(
        `the following key/context combination are missing translations\n${translationsMissingLanguages
          .map(
            t => `key: ${t.key}, context: ${t.contextId}, languages missing: ${t.missingLanguages}`
          )
          .join('\n')}`
      );
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

  async updateContext(
    context: { id: string; label: string },
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

      const defaultLanguageKey = await this.settingsDS.getDefaultLanguageKey();

      await Object.entries(valueChanges).reduce(async (previous, [key, value]) => {
        await previous;
        await this.translationsDS.updateValue(
          keysChangedReversed[key] || key,
          context.id,
          defaultLanguageKey,
          value
        );
      }, Promise.resolve());

      await this.translationsDS.updateContextLabel(context.id, context.label);

      await this.translationsDS.updateKeysByContext(context.id, keyChanges);

      await this.translationsDS.deleteKeysByContext(context.id, keysToDelete);

      await this.createNewKeys(keysChangedReversed, valueChanges, context);
    });
  }

  private async createNewKeys(
    keysChangedReversed: { [x: string]: string },
    valueChanges: { [key: string]: string },
    context: { id: string; label: string }
  ) {
    const newContext: TranslationContext = {
      ...(await this.translationsDS.getContext(context.id)),
      ...context,
    };

    const originalKeysGoingToChange = Object.keys(valueChanges).reduce<string[]>((keys, key) => {
      if (keysChangedReversed[key]) {
        keys.push(keysChangedReversed[key]);
      } else {
        keys.push(key);
      }
      return keys;
    }, []);

    const missingKeysInDB = await this.translationsDS.calculateUnexistentKeys(
      originalKeysGoingToChange
    );

    await this.translationsDS.insert(
      (
        await this.settingsDS.getLanguageKeys()
      ).reduce<Translation[]>(
        (memo, languageKey) =>
          memo.concat(
            missingKeysInDB.map(
              key => new Translation(key, valueChanges[key], languageKey, newContext)
            )
          ),
        []
      )
    );
  }
}
