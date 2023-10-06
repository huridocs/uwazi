import { secondsToDate, secondsToISODate } from '../dateHelpers';

describe('Date formatting helpers', () => {
  describe('seconds to localized dates', () => {
    it.each`
      seconds         | locale       | result
      ${1696624527}   | ${undefined} | ${'October 6, 2023'}
      ${1696624527}   | ${'en'}      | ${'October 6, 2023'}
      ${1696624527}   | ${'es'}      | ${'6 de octubre de 2023'}
      ${1696624527}   | ${'fr'}      | ${'6 octobre 2023'}
      ${1696624527}   | ${'ar'}      | ${'٦ أكتوبر ٢٠٢٣'}
      ${1696624527}   | ${'zh'}      | ${'2023年10月6日'}
      ${-20447942400} | ${undefined} | ${'January 12, 1322'}
      ${-20447942400} | ${'es'}      | ${'12 de enero de 1322'}
    `('should return a formatted date', ({ seconds, locale, result }) => {
      expect(secondsToDate(seconds, locale)).toEqual(result);
    });
  });

  describe('seconds to ISO date', () => {
    it.each`
      seconds           | result
      ${'1696624527'}   | ${'2023-10-06'}
      ${'1624624521'}   | ${'2021-06-25'}
      ${'-20447942400'} | ${'1322-01-12'}
    `('should return a ISO formatted date', ({ seconds, result }) => {
      expect(secondsToISODate(seconds)).toEqual(result);
    });
  });
});
