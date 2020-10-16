import moment from 'moment';

import date from '../date';

describe('date helper', () => {
  describe('descriptionToTimestamp', () => {
    it('should return date if it is already a timestamp', () => {
      const timestamp = moment().unix();
      expect(date.descriptionToTimestamp(timestamp)).toBe(timestamp);
    });

    it('transform "first-day-last-month" to timestamp', () => {
      spyOn(Date, 'now').and.returnValue(moment('2018-07-04'));

      expect(date.descriptionToTimestamp('first-day-last-month')).toBe(
        moment.utc('2018-06-01').unix()
      );
    });

    it('transform "last-day-last-month" to timestamp', () => {
      spyOn(Date, 'now').and.returnValue(moment('2018-07-04'));

      expect(date.descriptionToTimestamp('last-day-last-month')).toBe(
        moment.utc('2018-06-30T23:59:59').unix()
      );
    });
  });

  describe('add years to current date', () => {
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const newDate = date.addYearsToCurrentDate(1);
    expect(newDate).toEqual(nextYear);
  });
});
