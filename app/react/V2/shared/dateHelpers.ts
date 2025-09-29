import { DateTime } from 'luxon';

const normalizeLocaleForDisplay = (locale?: string) => {
  if (!locale) return 'en';
  // Ensure Arabic locales render Arabic-Indic digits deterministically in all environments
  if (locale.startsWith('ar') && !/\bu-nu-/.test(locale)) return 'ar-u-nu-arab';
  return locale;
};

const secondsToDate = (timestamp: number | string, locale?: string) =>
  DateTime.fromSeconds(Number(timestamp))
    .setZone('UTC')
    .toLocaleString(DateTime.DATE_FULL, { locale: normalizeLocaleForDisplay(locale) });

const secondsToISODate = (timestamp: number | string) =>
  DateTime.fromSeconds(Number(timestamp)).setZone('UTC').toISODate();

export { secondsToDate, secondsToISODate };
