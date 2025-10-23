import { getUnixTime, addHours, addDays } from 'date-fns';
import { isSameDate } from 'shared/isSameDate';

it('should only consider year, month and day', () => {
  const baseUtc = new Date('2020-01-01T12:00:00Z');
  const baseInAnHourUtc = addHours(baseUtc, 1);
  expect(isSameDate(getUnixTime(baseUtc), getUnixTime(baseInAnHourUtc))).toBe(true);

  const nextDayUtc = addDays(baseUtc, 1);
  expect(isSameDate(getUnixTime(baseUtc), getUnixTime(nextDayUtc))).toBe(false);
});
