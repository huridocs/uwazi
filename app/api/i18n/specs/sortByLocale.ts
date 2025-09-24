// @ts-expect-error TS(2307): Cannot find module '../../shared/translationType.j... Remove this comment to see the full error message
import { TranslationType } from 'shared/translationType.js';
import { IndexedTranslations } from '../translations';

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
