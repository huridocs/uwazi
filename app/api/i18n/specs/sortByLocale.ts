import { TranslationType } from '#shared/translationType.js';
import { IndexedTranslations } from '#api/i18n/translations.js';

export function sortByLocale(
  a: TranslationType | IndexedTranslations,
  b: TranslationType | IndexedTranslations
) {
  if (!a.locale || !b.locale) {
    throw new Error('Translations should have a locale');
  }
  if (a.locale < b.locale) {
    return -1;
  }
  if (a.locale > b.locale) {
    return 1;
  }
  return 0;
}
