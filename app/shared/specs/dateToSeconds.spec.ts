import { dateToSeconds } from '../dateToSeconds';

describe('dateToSeconds', () => {
  it.each`
    stringDate                     | expectedMilliseconds
    ${'2020-01-01'}                | ${1577836800}
    ${'17-05-2018'}                | ${1526515200}
    ${'11-21-1982'}                | ${406684800}
    ${'September 30, 1999'}        | ${938649600}
    ${'13 October 2012'}           | ${1350086400}
    ${'13th October 2012'}         | ${1350086400}
    ${'October 13th, 2012'}        | ${1350086400}
    ${'22 decembre 2012'}          | ${1356134400}
    ${'mercredi 22 decembre 2010'} | ${1292976000}
    ${'mercredi 22 décembre 2010'} | ${1292976000}
    ${'Marzo 14, 2006'}            | ${1142294400}
  `(
    'should convert $stringDate to $expectedMilliseconds',
    ({ stringDate, expectedMilliseconds }) => {
      expect(dateToSeconds(stringDate)).toBe(expectedMilliseconds);
    }
  );
});
