import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { Translation, TranslationContext } from '#api/core/domain/translation/Translation.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  IndexedContext,
  IndexedTranslations,
} from '#api/core/application/translation/localeTranslationDto.js';

function legacyContextType(context: Translation['context']): IndexedContext['type'] {
  if (context.id === 'System' || context.id === 'Filters' || context.id === 'Menu') {
    return 'Uwazi UI';
  }
  return context.type;
}

export class TranslationsQueryService {
  constructor(
    private translationsDS: TranslationsDataSource,
    private settingsDS: SettingsDataSource
  ) {}

  async getContextValueMap(
    language: LanguageISO6391,
    contextId: string
  ): Promise<Record<string, string>> {
    const translations = await this.translationsDS.getByLanguageAndContext(language, contextId);
    const values: Record<string, string> = {};
    translations.forEach(translation => {
      values[translation.key] = translation.value;
    });
    return values;
  }

  async getLanguageValueMaps(
    language: LanguageISO6391
  ): Promise<Record<string, Record<string, string>>> {
    const translations = await this.translationsDS.getByLanguage(language);
    const byContext: Record<string, Record<string, string>> = {};
    translations.forEach(translation => {
      const contextId = translation.context.id;
      if (!byContext[contextId]) {
        byContext[contextId] = {};
      }
      byContext[contextId][translation.key] = translation.value;
    });
    return byContext;
  }

  private async toLegacyDto(
    load: () => Promise<Translation[]>,
    onlyLanguage?: LanguageISO6391
  ): Promise<IndexedTranslations[]> {
    let languageKeys = await this.settingsDS.getLanguageKeys();
    if (onlyLanguage) {
      languageKeys = [onlyLanguage];
    }

    const resultMap: { [language: string]: IndexedTranslations & { locale: string } } = {};
    const contexts: {
      [language: string]: { [context: string]: IndexedContext };
    } = {};

    languageKeys.forEach(key => {
      resultMap[key] = { locale: key, contexts: [] };
      contexts[key] = {};
    });

    const translations = await load();
    translations.forEach(translation => {
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
          type: legacyContextType(translation.context),
          values: {},
        };
      }
      // Mutating assignment. Object-spread-per-key in reduce was ~16s CPU per SSR on large thesauri.
      if (translation.key && translation.value) {
        contexts[translation.language][translation.context.id].values[translation.key] =
          translation.value;
      }
    });

    return Object.values(resultMap).map(translation => ({
      ...translation,
      contexts: Object.values(contexts[translation.locale as string]),
    }));
  }

  async getLegacy(
    query: {
      locale?: LanguageISO6391;
      context?: string;
      excludeContextTypes?: TranslationContext['type'][];
    } = {}
  ) {
    if (query.locale && query.context) {
      return this.toLegacyDto(
        async () => this.translationsDS.getByLanguageAndContext(query.locale!, query.context!),
        query.locale
      );
    }
    if (query.context) {
      return this.toLegacyDto(async () => this.translationsDS.getByContext(query.context!));
    }
    if (query.locale && query.excludeContextTypes?.length) {
      return this.toLegacyDto(
        async () =>
          this.translationsDS.getByLanguageExcludingContextTypes(
            query.locale!,
            query.excludeContextTypes!
          ),
        query.locale
      );
    }
    if (query.locale) {
      return this.toLegacyDto(
        async () => this.translationsDS.getByLanguage(query.locale!),
        query.locale
      );
    }
    return this.toLegacyDto(async () => this.translationsDS.getAll());
  }
}
