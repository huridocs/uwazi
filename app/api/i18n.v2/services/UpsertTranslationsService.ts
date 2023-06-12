import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { DuplicatedKeyError } from 'api/common.v2/errors/DuplicatedKeyError';
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

  private async insertIgnoringDuplicatedError(translations: Translation[]) {
    try {
      await this.translationsDS.insert(translations);
    } catch (e) {
      if (!(e instanceof DuplicatedKeyError)) {
        throw e;
      }
    }
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
    keyChanges: { [x: string]: string },
    valueChanges: { [k: string]: string },
    keysToDelete: string[]
  ) {
    return this.transactionManager.run(async () => {
      const newContext: TranslationContext = {
        ...(await this.translationsDS.getContext(context.id)),
        ...context,
      };

      const defaultLanguageKey = await this.settingsDS.getDefaultLanguageKey();
      await this.translationsDS.updateContextLabel(context.id, context.label);
      await this.translationsDS.updateContextKeys(context.id, keyChanges);

      await Object.entries(valueChanges).reduce(async (previous, [key, value]) => {
        await previous;
        await this.translationsDS.updateValue(key, context.id, defaultLanguageKey, value);
      }, Promise.resolve());

      await this.translationsDS.deleteKeysByContext(context.id, keysToDelete);

      const create: Translation[] = (await this.settingsDS.getLanguageKeys()).reduce<Translation[]>(
        (memo, languageKey) =>
          memo.concat(
            Object.entries(valueChanges).map(
              ([key, value]) => new Translation(key, value, languageKey, newContext)
            )
          ),
        []
      );
      await this.insertIgnoringDuplicatedError(create);
    });
  }
}
