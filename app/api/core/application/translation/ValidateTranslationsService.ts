import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import {
  LanguageDoesNotExist,
  TranslationMissingLanguages,
} from '#api/core/domain/translation/errors.js';
import { Translation, TranslationContext } from '#api/core/domain/translation/Translation.js';
import { objectIndex, objectIndexToArrays } from '#shared/data_utils/objectIndex.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

export type TranslationEntryInput = {
  language: LanguageISO6391;
  key: string;
  value: string;
  context: TranslationContext;
};

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
  constructor(
    private translationsDS: TranslationsDataSource,
    private settingsDS: SettingsDataSource
  ) {}

  async languagesExist(translations: TranslationEntryInput[]) {
    const allowedLanguageKeys = await this.settingsDS.getLanguageKeys();
    const difference = translations
      .map(t => t.language)
      .filter(key => !allowedLanguageKeys.includes(key))
      .filter((key, index, array) => array.indexOf(key) === index);
    if (difference.length) {
      throw new LanguageDoesNotExist(JSON.stringify(difference));
    }
  }

  async translationsWillExistsInAllLanguages(translations: TranslationEntryInput[]) {
    const configuredLanguageKeys = await this.settingsDS.getLanguageKeys();
    const groupedByKeyContext = languagesForKeyContext(
      translations.map(t => new Translation(t.key, t.value, t.language, t.context))
    );

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
