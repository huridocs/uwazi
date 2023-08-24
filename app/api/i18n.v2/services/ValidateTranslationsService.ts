import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { objectIndex, objectIndexToArrays } from 'shared/data_utils/objectIndex';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { LanguageDoesNotExist, TranslationMissingLanguages } from '../errors/translationErrors';
import { Translation } from '../model/Translation';
import { CreateTranslationsData } from './CreateTranslationsService';

const languagesForKeyContext = (
  translations: Translation[]
): { key: string; contextId: string; missingLanguages: LanguageISO6391[] }[] =>
  Object.values(
    translations.reduce<
      Record<string, { key: string; contextId: string; missingLanguages: LanguageISO6391[] }>
    >((result, item) => {
      const key = `${item.key}${item.context.id}`;
      if (!result[key]) {
        // eslint-disable-next-line no-param-reassign
        result[key] = {
          key: item.key,
          contextId: item.context.id,
          missingLanguages: [],
        };
      }
      result[key].missingLanguages.push(item.language);
      return result;
    }, {})
  );

export class ValidateTranslationsService {
  private translationsDS: TranslationsDataSource;

  private settingsDS: SettingsDataSource;

  constructor(translationsDS: TranslationsDataSource, settingsDS: SettingsDataSource) {
    this.translationsDS = translationsDS;
    this.settingsDS = settingsDS;
  }

  async languagesExist(translations: CreateTranslationsData[]) {
    const allowedLanguageKeys = await this.settingsDS.getLanguageKeys();
    const difference = translations
      .map(t => t.language)
      .filter(key => !allowedLanguageKeys.includes(key))
      .filter((key, index, array) => array.indexOf(key) === index);
    if (difference.length) {
      throw new LanguageDoesNotExist(JSON.stringify(difference));
    }
  }

  async translationsWillExistsInAllLanguages(translations: CreateTranslationsData[]) {
    const configuredLanguageKeys = await this.settingsDS.getLanguageKeys();
    const groupedByKeyContext = languagesForKeyContext(translations);

    const translationsByContext = objectIndexToArrays(
      groupedByKeyContext,
      t => t.contextId,
      t => t
    );

    await Object.entries(translationsByContext).reduce(
      async (previous, [contextId, contextTranslations]) => {
        await previous;
        const dbTranslations = this.translationsDS.getContextAndKeys(
          contextId,
          contextTranslations.map(t => t.key)
        );

        const translationsByKey = objectIndex(
          contextTranslations,
          t => t.key,
          t => t
        );

        await dbTranslations.forEach(async dbt => {
          translationsByKey[dbt.key].missingLanguages.push(dbt.language);
        });
      },
      Promise.resolve()
    );

    const translationsMissingLanguages = groupedByKeyContext.reduce(
      (memo, t) => {
        const set = new Set(configuredLanguageKeys);
        t.missingLanguages.forEach(key => {
          set.delete(key);
        });
        if (set.size) {
          // eslint-disable-next-line no-param-reassign
          t.missingLanguages = Array.from(set);
          memo.push(t);
        }
        return memo;
      },
      [] as { key: string; contextId: string; missingLanguages: string[] }[]
    );

    if (translationsMissingLanguages.length) {
      throw new TranslationMissingLanguages(
        `the following key/context combination are missing translations\n${translationsMissingLanguages
          .map(
            t => `key: ${t.key}, context: ${t.contextId}, languages missing: ${t.missingLanguages}`
          )
          .join('\n')}`
      );
    }
  }
}
