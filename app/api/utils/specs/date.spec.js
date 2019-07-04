import moment from 'moment';

import date from '../date';

describe('date helper', () => {
  describe('naturalLanguageToTimestamp', () => {
    it('should return date if it is already a timestamp', () => {
      const timestamp = moment().unix();
      expect(date.naturalLanguageToTimestamp(timestamp)).toBe(timestamp);
    });

    it('transform "first-day-last-month" to timestamp', () => {
      spyOn(Date, 'now').and.returnValue(moment('2018-07-04'));

      expect(date.naturalLanguageToTimestamp('first-day-last-month'))
      .toBe(moment.utc('2018-06-01').unix());
    });

    it('transform "last-day-last-month" to timestamp', () => {
      spyOn(Date, 'now').and.returnValue(moment('2018-07-04'));

      expect(date.naturalLanguageToTimestamp('last-day-last-month'))
      .toBe(moment.utc('2018-06-30T23:59:59').unix());
    });
  });
});
