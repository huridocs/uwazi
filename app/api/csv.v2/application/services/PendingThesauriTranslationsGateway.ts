import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';

const resolveContextLabel = async (
  translationsDS: TranslationsDataSource,
  contextId: string,
  contextLabel?: string
) => {
  if (contextLabel) {
    return contextLabel;
  }

  const existing = await translationsDS.getByContext(contextId).all();
  return existing[0]?.context.label || contextId;
};

const buildTranslations = (
  contextId: string,
  contextLabel: string,
  keyValuePairsPerLanguage: Record<string, Record<string, string>>
) => {
  const translations: Translation[] = [];

  Object.entries(keyValuePairsPerLanguage).forEach(([language, keyValuePairs]) => {
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      translations.push(
        new Translation(key, value, language as LanguageISO6391, {
          id: contextId,
          label: contextLabel,
          type: 'Thesaurus',
        })
      );
    });
  });

  return translations;
};

const upsertThesaurusTranslations = async (
  translationsDS: TranslationsDataSource,
  contextId: string,
  keyValuePairsPerLanguage: Record<string, Record<string, string>>,
  contextLabel?: string
) => {
  if (!Object.keys(keyValuePairsPerLanguage).length) {
    return;
  }

  const resolvedContextLabel = await resolveContextLabel(translationsDS, contextId, contextLabel);
  const translations = buildTranslations(contextId, resolvedContextLabel, keyValuePairsPerLanguage);
  if (!translations.length) {
    return;
  }

  await translationsDS.upsert(translations);
};

export { upsertThesaurusTranslations };
