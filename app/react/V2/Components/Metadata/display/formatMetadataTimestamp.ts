import { DateTime } from 'luxon';
import type { DisplayContext } from './displayContext.js';

const normalizeTimestamp = (timestamp: number) =>
  timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;

const formatMetadataTimestamp = (timestamp: number, context: DisplayContext): string => {
  const luxonDate = DateTime.fromSeconds(normalizeTimestamp(timestamp), { zone: 'utc' }).setLocale(
    context.locale
  );
  if (!luxonDate.isValid) {
    return '';
  }
  return luxonDate.toLocaleString(context.dateFormat ?? DateTime.DATE_MED);
};

export { formatMetadataTimestamp, normalizeTimestamp };
