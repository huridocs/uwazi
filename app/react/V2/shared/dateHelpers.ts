import { DateTime } from 'luxon';

const secondsToDate = (timestamp: number | string, locale?: string) =>
  DateTime.fromSeconds(Number(timestamp))
    .setZone('UTC')
    .toLocaleString(DateTime.DATE_FULL, { locale: locale || 'en' });

const secondsToISODate = (timestamp: number | string) =>
  DateTime.fromSeconds(Number(timestamp)).setZone('UTC').toISODate();

export { secondsToDate, secondsToISODate };
