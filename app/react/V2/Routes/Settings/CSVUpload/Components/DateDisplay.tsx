import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { localeAtom } from '#app/V2/atoms/index.js';

const DateDisplay = ({ value }: { value: number }) => {
  const locale = useAtomValue(localeAtom);

  if (Number.isNaN(value)) {
    return '-';
  }

  let luxonInstance = DateTime.fromMillis(value, { zone: 'utc' });

  luxonInstance = luxonInstance.setLocale(locale || 'en');

  return luxonInstance.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
};

export { DateDisplay };
