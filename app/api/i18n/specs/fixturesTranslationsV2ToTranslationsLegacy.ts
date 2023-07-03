import { TranslationDBO } from 'api/i18n.v2/schemas/TranslationDBO';
import { EnforcedWithId } from 'api/odm';
import { TranslationContext, TranslationType, TranslationValue } from 'shared/translationType';
import { LanguageISO6391 } from 'shared/types/commonTypes';

export const fixturesTranslationsV2ToTranslationsLegacy = (translations: TranslationDBO[]) => {
  const languageSet = new Set<LanguageISO6391>();
  translations.forEach(t => {
    languageSet.add(t.language);
  });
  const languageKeys = Array.from(languageSet);

  // const resultMap: { [language: string]: TranslationType & { locale: string } } = {};
  const resultMap = languageKeys.reduce<{
    [language: string]: TranslationType & { locale: string };
  }>((memo, key) => {
    // eslint-disable-next-line no-param-reassign
    memo[key] = { locale: key, contexts: [] };
    return memo;
  }, {});

  const contexts = languageKeys.reduce<{
    [language: string]: { [context: string]: TranslationContext & { values: TranslationValue[] } };
  }>((memo, key) => {
    // eslint-disable-next-line no-param-reassign
    memo[key] = {};
    return memo;
  }, {});

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
        type: translation.context.type,
        values: [],
      };
    }
    contexts[translation.language][translation.context.id].values.push({
      key: translation.key,
      value: translation.value,
    });
  });

  return Object.values(resultMap).map(translation => {
    // eslint-disable-next-line no-param-reassign
    translation.contexts = Object.values(contexts[translation.locale]);
    return translation;
  }) as EnforcedWithId<TranslationType>[];
};
