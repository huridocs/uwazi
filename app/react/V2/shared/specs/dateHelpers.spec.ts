import { secondsToDate, secondsToISODate, parseLocalizedDate } from '../dateHelpers';

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

  describe('parseLocalizedDate', () => {
    describe('Greek date parsing', () => {
      it.each`
        dateString               | language   | expectedTimestamp
        ${'18ης Ιουλίου 2025'}   | ${'el'}    | ${1752796800}
        ${'18ης Ιουλίου 2025'}   | ${'ell'}   | ${1752796800}
        ${'18ης Ιουλίου 2025'}   | ${'greek'} | ${1752796800}
        ${'18ης Ιουλίου 2025'}   | ${'gre'}   | ${1752796800}
        ${'18 Ιουλίου 2025'}     | ${'el'}    | ${1752796800}
        ${'1η Ιανουαρίου 2025'}  | ${'el'}    | ${1735689600}
        ${'1ος Ιανουαρίου 2025'} | ${'el'}    | ${1735689600}
      `(
        'should parse Greek date "$dateString" with language "$language"',
        ({ dateString, language, expectedTimestamp }) => {
          const result = parseLocalizedDate(dateString, language);
          expect(result).toBe(expectedTimestamp);
        }
      );
    });

    describe('English date parsing', () => {
      it.each`
        dateString            | language     | expectedTimestamp
        ${'18th July 2025'}   | ${'en'}      | ${1752796800}
        ${'18th July 2025'}   | ${'eng'}     | ${1752796800}
        ${'18th July 2025'}   | ${'english'} | ${1752796800}
        ${'18 July 2025'}     | ${'en'}      | ${1752796800}
        ${'July 18, 2025'}    | ${'en'}      | ${1752796800}
        ${'1st January 2025'} | ${'en'}      | ${1735689600}
        ${'2nd January 2025'} | ${'en'}      | ${1735776000}
        ${'3rd January 2025'} | ${'en'}      | ${1735862400}
        ${'4th January 2025'} | ${'en'}      | ${1735948800}
      `(
        'should parse English date "$dateString" with language "$language"',
        ({ dateString, language, expectedTimestamp }) => {
          const result = parseLocalizedDate(dateString, language);
          expect(result).toBe(expectedTimestamp);
        }
      );
    });

    describe('Spanish date parsing', () => {
      it.each`
        dateString                | language     | expectedTimestamp
        ${'18 de julio de 2025'}  | ${'es'}      | ${1752796800}
        ${'18 de julio de 2025'}  | ${'spa'}     | ${1752796800}
        ${'18 de julio de 2025'}  | ${'spanish'} | ${1752796800}
        ${'18 de julio de 2025'}  | ${'español'} | ${1752796800}
        ${'18º de julio de 2025'} | ${'es'}      | ${1752796800}
        ${'1ª de enero de 2025'}  | ${'es'}      | ${1735689600}
      `(
        'should parse Spanish date "$dateString" with language "$language"',
        ({ dateString, language, expectedTimestamp }) => {
          const result = parseLocalizedDate(dateString, language);
          expect(result).toBe(expectedTimestamp);
        }
      );
    });

    describe('French date parsing', () => {
      it.each`
        dateString              | language      | expectedTimestamp
        ${'18 juillet 2025'}    | ${'fr'}       | ${1752796800}
        ${'18 juillet 2025'}    | ${'fra'}      | ${1752796800}
        ${'18 juillet 2025'}    | ${'french'}   | ${1752796800}
        ${'18 juillet 2025'}    | ${'français'} | ${1752796800}
        ${'18ème juillet 2025'} | ${'fr'}       | ${1752796800}
        ${'1er janvier 2025'}   | ${'fr'}       | ${1735689600}
        ${'1ère janvier 2025'}  | ${'fr'}       | ${1735689600}
        ${'2ème janvier 2025'}  | ${'fr'}       | ${1735776000}
      `(
        'should parse French date "$dateString" with language "$language"',
        ({ dateString, language, expectedTimestamp }) => {
          const result = parseLocalizedDate(dateString, language);
          expect(result).toBe(expectedTimestamp);
        }
      );
    });

    describe('German date parsing', () => {
      it.each`
        dateString          | language     | expectedTimestamp
        ${'18. Juli 2025'}  | ${'de'}      | ${1752796800}
        ${'18. Juli 2025'}  | ${'deu'}     | ${1752796800}
        ${'18. Juli 2025'}  | ${'ger'}     | ${1752796800}
        ${'18. Juli 2025'}  | ${'german'}  | ${1752796800}
        ${'18. Juli 2025'}  | ${'deutsch'} | ${1752796800}
        ${'18 Juli 2025'}   | ${'de'}      | ${1752796800}
        ${'1. Januar 2025'} | ${'de'}      | ${1735689600}
        ${'2. Januar 2025'} | ${'de'}      | ${1735776000}
      `(
        'should parse German date "$dateString" with language "$language"',
        ({ dateString, language, expectedTimestamp }) => {
          const result = parseLocalizedDate(dateString, language);
          expect(result).toBe(expectedTimestamp);
        }
      );
    });

    describe('Numeric date formats', () => {
      it.each`
        dateString      | language | expectedTimestamp
        ${'2025-07-18'} | ${'en'}  | ${1752796800}
        ${'18/07/2025'} | ${'en'}  | ${1752796800}
        ${'07/18/2025'} | ${'en'}  | ${1752796800}
        ${'18.07.2025'} | ${'en'}  | ${1752796800}
        ${'8.07.2025'}  | ${'en'}  | ${1751932800}
        ${'2025.07.18'} | ${'en'}  | ${1752796800}
        ${'2025/07/18'} | ${'en'}  | ${1752796800}
      `(
        'should parse numeric date "$dateString"',
        ({ dateString, language, expectedTimestamp }) => {
          const result = parseLocalizedDate(dateString, language);
          expect(result).toBe(expectedTimestamp);
        }
      );
    });

    describe('Edge cases', () => {
      it('should return null for empty string', () => {
        const result = parseLocalizedDate('', 'en');
        expect(result).toBeNull();
      });

      it('should return null for invalid date string', () => {
        const result = parseLocalizedDate('invalid date', 'en');
        expect(result).toBeNull();
      });

      it('should handle unknown language code with fallback', () => {
        const result = parseLocalizedDate('18 July 2025', 'unknown');
        expect(result).toBe(1752796800);
      });

      it('should handle case insensitive language codes', () => {
        const result = parseLocalizedDate('18 July 2025', 'ENGLISH');
        expect(result).toBe(1752796800);
      });

      it('should handle mixed case language codes', () => {
        const result = parseLocalizedDate('18ης Ιουλίου 2025', 'El');
        expect(result).toBe(1752796800);
      });
    });

    describe('Fallback behavior', () => {
      it('should fallback to English when target language parsing fails', () => {
        const result = parseLocalizedDate('18 July 2025', 'el');
        expect(result).toBe(1752796800);
      });

      it('should fallback to ISO parsing when all else fails', () => {
        const result = parseLocalizedDate('2025-07-18T00:00:00.000Z', 'en');
        expect(result).toBe(1752796800); // UTC timestamp for 2025-07-18T00:00:00.000Z
      });
    });
  });
});
