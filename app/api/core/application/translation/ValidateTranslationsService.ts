import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import {
  LanguageDoesNotExist,
  TranslationMissingLanguages,
} from '#api/core/domain/translation/errors.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { objectIndex, objectIndexToArrays } from '#shared/data_utils/objectIndex.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type KeyContextLanguages = {
  key: string;
  contextId: string;
  missingLanguages: LanguageISO6391[];
};

const languagesForKeyContext = (translations: Translation[]): KeyContextLanguages[] =>
  Object.values(
    translations.reduce<Record<string, KeyContextLanguages>>((result, item) => {
      const groupKey = `${item.key}${item.context.id}`;
      const existing = result[groupKey];
      if (!existing) {
        return {
          ...result,
          [groupKey]: {
            key: item.key,
            contextId: item.context.id,
            missingLanguages: [item.language],
          },
        };
      }

      existing.missingLanguages.push(item.language);
      return result;
    }, {})
  );

class ValidateTranslationsService {
  constructor(
    private translationsDS: TranslationsDataSource,
    private settingsDS: SettingsDataSource
  ) {}

  async languagesExist(translations: Translation[]) {
    const allowedLanguageKeys = await this.settingsDS.getLanguageKeys();
    const difference = translations
      .map(t => t.language)
      .filter(key => !allowedLanguageKeys.includes(key))
      .filter((key, index, array) => array.indexOf(key) === index);
    if (difference.length) {
      throw new LanguageDoesNotExist(JSON.stringify(difference));
    }
  }

  async translationsWillExistsInAllLanguages(translations: Translation[]) {
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
        const dbTranslations = await this.translationsDS.getContextAndKeys(
          contextId,
          contextTranslations.map(t => t.key)
        );

        const translationsByKey = objectIndex(
          contextTranslations,
          t => t.key,
          t => t
        );

        dbTranslations.forEach(dbt => {
          translationsByKey[dbt.key].missingLanguages.push(dbt.language);
        });
      },
      Promise.resolve()
    );

    const translationsMissingLanguages = groupedByKeyContext.reduce<KeyContextLanguages[]>(
      (memo, t) => {
        const missing = configuredLanguageKeys.filter(key => !t.missingLanguages.includes(key));
        if (missing.length) {
          memo.push({
            key: t.key,
            contextId: t.contextId,
            missingLanguages: missing,
          });
        }
        return memo;
      },
      []
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

export { ValidateTranslationsService };
