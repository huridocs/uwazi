import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { EnforcedWithId } from '#api/odm/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationContext, TranslationType, TranslationValue } from '#shared/translationType.js';

export class TranslationsQueryService {
  constructor(
    private translationsDS: TranslationsDataSource,
    private settingsDS: SettingsDataSource
  ) {}

  getAll(): ResultSet<Translation> {
    return this.translationsDS.getAll();
  }

  getByLanguage(language: LanguageISO6391): ResultSet<Translation> {
    return this.translationsDS.getByLanguage(language);
  }

  getByContext(contextId: string): ResultSet<Translation> {
    return this.translationsDS.getByContext(contextId);
  }

  async toLegacyDto(
    result: ResultSet<Translation>,
    onlyLanguage?: LanguageISO6391
  ): Promise<EnforcedWithId<TranslationType>[]> {
    let languageKeys = await this.settingsDS.getLanguageKeys();
    if (onlyLanguage) {
      languageKeys = [onlyLanguage];
    }

    const resultMap: { [language: string]: TranslationType & { locale: string } } = {};
    const contexts: {
      [language: string]: {
        [context: string]: TranslationContext & { values: TranslationValue[] };
      };
    } = {};

    languageKeys.forEach(key => {
      resultMap[key] = { locale: key, contexts: [] };
      contexts[key] = {};
    });

    await result.forEach(translation => {
      if (!resultMap[translation.language]) {
        resultMap[translation.language] = {
          locale: translation.language,
          contexts: [],
        };
        contexts[translation.language] = {};
      }
      if (!contexts[translation.language][translation.context.id]) {
        contexts[translation.language][translation.context.id] = {
          id: translation.context.id,
          label: translation.context.label,
          type: translation.context.type,
          values: [],
        };
      }
      contexts[translation.language][translation.context.id].values.push({
        key: translation.key,
        value: translation.value,
      });
    });

    return Object.values(resultMap).map(translation => ({
      ...translation,
      contexts: Object.values(contexts[translation.locale]),
    })) as EnforcedWithId<TranslationType>[];
  }

  async getLegacy(query: { locale?: LanguageISO6391; context?: string } = {}) {
    if (query.context) {
      return this.toLegacyDto(this.getByContext(query.context));
    }
    if (query.locale) {
      return this.toLegacyDto(this.getByLanguage(query.locale), query.locale);
    }
    return this.toLegacyDto(this.getAll());
  }
}
