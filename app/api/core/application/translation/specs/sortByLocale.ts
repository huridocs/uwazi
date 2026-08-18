import { IndexedTranslations } from '#api/core/application/translation/localeTranslationDto.js';

export function sortByLocale(a: IndexedTranslations, b: IndexedTranslations) {
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
