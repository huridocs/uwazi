import { IndexedTranslations } from '#api/core/infrastructure/express/translation/LegacyTranslationDtoMapper.js';
import { TranslationType } from '#shared/translationType.js';

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
