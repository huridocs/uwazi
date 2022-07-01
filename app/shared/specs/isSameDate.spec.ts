import moment from 'moment';
import { isSameDate } from 'shared/isSameDate';

it('should only consider year, month and day', () => {
  const todayUtc = moment().utc();
  const todayInAnHourUtc = todayUtc.clone().add(1, 'hour');
  expect(isSameDate(todayUtc.unix(), todayInAnHourUtc.unix())).toBe(true);

  const tomorrowUtc = todayUtc.clone().add(1, 'day');
  expect(isSameDate(todayUtc.unix(), tomorrowUtc.unix())).toBe(false);
});
