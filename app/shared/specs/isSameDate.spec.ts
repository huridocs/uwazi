import moment from 'moment';
import { isSameDate } from 'shared/isSameDate';

it('should only consider year, month and day', () => {
  const baseUtc = moment.utc('2020-01-01T12:00:00Z');
  const baseInAnHourUtc = baseUtc.clone().add(1, 'hour');
  expect(isSameDate(baseUtc.unix(), baseInAnHourUtc.unix())).toBe(true);

  const nextDayUtc = baseUtc.clone().add(1, 'day');
  expect(isSameDate(baseUtc.unix(), nextDayUtc.unix())).toBe(false);
});
