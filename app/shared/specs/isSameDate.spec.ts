import moment from 'moment';
// @ts-expect-error TS(2307): Cannot find module './isSameDate.js' or its corres... Remove this comment to see the full error message
import { isSameDate } from './isSameDate.js';

it('should only consider year, month and day', () => {
  const todayUtc = moment().utc();
  const todayInAnHourUtc = todayUtc.clone().add(1, 'hour');
  expect(isSameDate(todayUtc.unix(), todayInAnHourUtc.unix())).toBe(true);

  const tomorrowUtc = todayUtc.clone().add(1, 'day');
  expect(isSameDate(todayUtc.unix(), tomorrowUtc.unix())).toBe(false);
});
