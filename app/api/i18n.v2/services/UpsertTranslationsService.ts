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

  async updateContext(
    context: { id: string; label: string },
    keyChanges: { [x: string]: string },
    valueChanges: { [k: string]: string },
    keysToDelete: string[]
  ) {
    return this.transactionManager.run(async () => {
      const defaultLanguageKey = await this.settingsDS.getDefaultLanguageKey();
      await this.translationsDS.updateContextLabel(context.id, context.label);
      await this.translationsDS.updateContextKeys(context.id, keyChanges);

      await Object.entries(valueChanges).reduce(async (previous, [key, value]) => {
        await previous;
        await this.translationsDS.updateValue(key, context.id, defaultLanguageKey, value);
      }, Promise.resolve());

      await this.translationsDS.deleteKeysByContext(context.id, keysToDelete);

      const { context: existingContext } = await this.translationsDS
        .getByContext(context.id)
        .first();

      const create: CreateTranslationsData[] = (await this.settingsDS.getLanguageKeys()).reduce(
        (memo, languageKey) =>
          memo.concat(
            Object.entries(valueChanges).map(([key, value]) => ({
              key,
              value,
              language: languageKey,
              context: existingContext,
            }))
          ),
        [] as CreateTranslationsData[]
      );

      await this.translationsDS.insertAndIgnoreUniqueError(create);
    });
  }
}
