import { UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';
import translations from '#api/i18n/translations.js';

/**
 * Temporary bridge for System CSV predefined import (FS + façade path).
 * Intentionally outside translation Mongo transactions.
 */
async function importPredefinedTranslations(locale: string): Promise<void> {
  try {
    await translations.importPredefined(locale);
  } catch (error) {
    if (!(error instanceof UITranslationNotAvailable)) throw error;
  }
}

type ImportPredefinedTranslations = {
  execute: (locale: string) => Promise<void>;
};

const ImportPredefinedTranslationsService: ImportPredefinedTranslations = {
  execute: importPredefinedTranslations,
};

export { ImportPredefinedTranslationsService, importPredefinedTranslations };
export type { ImportPredefinedTranslations };
