import { DefaultTranslations } from '#api/i18n/defaultTranslations.js';
import { legacyLogger } from '#api/log/index.js';
import { prettifyError } from '#api/utils/handleError.js';
import { availableLanguages } from '#shared/language/index.js';

/**
 * Lists ISO languages and whether a predefined UI translation CSV exists.
 */
async function getAvailableLanguages() {
  let languagesWithTranslations: string[] = [];
  try {
    languagesWithTranslations = await DefaultTranslations.retrieveAvailablePredefinedLanguages();
  } catch (e) {
    legacyLogger.error(prettifyError(e));
    return availableLanguages;
  }

  return availableLanguages.map(language => ({
    ...language,
    translationAvailable: languagesWithTranslations.includes(language.key),
  }));
}

type AvailableLanguagesQuery = {
  execute: () => ReturnType<typeof getAvailableLanguages>;
};

const AvailableLanguagesQueryService: AvailableLanguagesQuery = {
  execute: getAvailableLanguages,
};

export { AvailableLanguagesQueryService, getAvailableLanguages };
export type { AvailableLanguagesQuery };
