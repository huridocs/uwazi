import { LanguageSchema, LanguagesListSchema } from '#shared/types/commonTypes.js';
import { LanguageUtils } from '#shared/language/index.js';

const toPersistableLanguage = (language: LanguageSchema): LanguageSchema => {
  const persisted: LanguageSchema = {
    key: language.key,
    label: language.label,
  };
  if (language.default) {
    persisted.default = true;
  }
  if (language.installing !== undefined) {
    persisted.installing = language.installing;
  }
  return persisted;
};

const toPersistableLanguages = (languages: LanguagesListSchema): LanguagesListSchema =>
  languages.map(toPersistableLanguage);

const toReadableLanguage = (language: LanguageSchema): LanguageSchema => {
  const catalog = LanguageUtils.fromISO639_1(language.key);
  return {
    ...catalog,
    key: language.key,
    label: language.label,
    ...(language.default ? { default: true } : {}),
    ...(language.installing !== undefined ? { installing: language.installing } : {}),
  };
};

const toReadableLanguages = (
  languages: LanguagesListSchema | undefined
): LanguagesListSchema | undefined => {
  if (!languages) {
    return languages;
  }
  return languages.map(toReadableLanguage);
};

export { toPersistableLanguage, toPersistableLanguages, toReadableLanguages };
