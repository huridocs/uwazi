import moment from 'moment';

import date from '../date';

describe('date helper', () => {
  describe('descriptionToTimestamp', () => {
    it('should return date if it is already a timestamp', () => {
      const timestamp = moment().unix();
      expect(date.descriptionToTimestamp(timestamp)).toBe(timestamp);
    });

    it('transform "first-day-last-month" to timestamp', () => {
      jest.spyOn(Date, 'now').mockReturnValue(moment('2018-07-04'));

      expect(date.descriptionToTimestamp('first-day-last-month')).toBe(
        moment.utc('2018-06-01').unix()
      );
    });

    it('transform "last-day-last-month" to timestamp', () => {
      jest.spyOn(Date, 'now').mockReturnValue(moment('2018-07-04'));

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
  describe('dateToSeconds', () => {
    it.each`
      stringDate                     | language     | expectedMilliseconds
      ${'5-2-2020'}                  | ${'eng'}     | ${1580860800}
      ${'5-2-2020'}                  | ${'en-US'}   | ${1588377600}
      ${'2020-01-01'}                | ${undefined} | ${1577836800}
      ${'17-05-2018'}                | ${undefined} | ${1526515200}
      ${'17/05/2018'}                | ${undefined} | ${1526515200}
      ${'11-21-1982'}                | ${undefined} | ${406684800}
      ${'05-17-2018'}                | ${undefined} | ${1526515200}
      ${'September 30, 1999'}        | ${undefined} | ${938649600}
      ${'13 October 2012'}           | ${undefined} | ${1350086400}
      ${'13th October 2012'}         | ${undefined} | ${1350086400}
      ${'October 13th, 2012'}        | ${undefined} | ${1350086400}
      ${'22 decembre 2012'}          | ${undefined} | ${1356134400}
      ${'mercredi 22 décembre 2010'} | ${undefined} | ${1292976000}
      ${'Marzo 14, 2006'}            | ${undefined} | ${1142294400}
      ${'28 августа 2017'}           | ${'rus'}     | ${1503878400}
      ${'августа 28, 2017'}          | ${'rus'}     | ${1503878400}
      ${'1 de septiembre de 2001'}   | ${'spa'}     | ${999302400}
    `(
      'should convert $stringDate to $expectedMilliseconds',
      ({ stringDate, language, expectedMilliseconds }) => {
        expect(date.dateToSeconds(stringDate, language)).toBe(expectedMilliseconds);
      }
    );
  });
});
