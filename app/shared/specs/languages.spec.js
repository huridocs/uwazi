import { detectLanguage } from 'shared/detectLanguage';
import { availableLanguages, LanguageUtils } from 'shared/language';
import { otherLanguageSchema } from 'shared/language/availableLanguages';

describe('languages', () => {
  describe('detectLanguage', () => {
    it('should return the text language (for elasticsearch by default)', () => {
      expect(detectLanguage('de que color es el caballo blanco de santiago')).toBe('spanish');
      expect(detectLanguage('what is the colour of the white horse of santiago')).toBe('english');
    });

    it('should return the text language for a specific purpose if selected', () => {
      expect(detectLanguage('de que color es el caballo blanco de santiago', 'ISO639_1')).toBe(
        'es'
      );
      expect(detectLanguage('what is the colour of the white horse of santiago', 'ISO639_1')).toBe(
        'en'
      );
      expect(detectLanguage('de que color es el caballo blanco de santiago', 'ISO639_3')).toBe(
        'spa'
      );
      expect(detectLanguage('what is the colour of the white horse of santiago', 'ISO639_3')).toBe(
        'eng'
      );

      expect(detectLanguage('Це перевірка', 'ISO639_3')).toBe('ukr');
    });

    it('should return other when the language is not supported', () => {
      expect(detectLanguage('color chIS Sargh santiago')).toBe('other');
      expect(detectLanguage('sdgfghhg hgjk ljhgfhgjk ghgjh ghfdfgfartytuasd fjh fghjgjasd')).toBe(
        'other'
      );
    });
  });

  describe('Language Utils', () => {
    it('should return language schema for the given a ISO639_3 language code', () => {
      const input = availableLanguages[0];

      expect(LanguageUtils.fromISO639_3(input.ISO639_3)).toEqual(input);
    });

    it('should return default language schema if given a ISO639_3 language code that does not exist on available languages', () => {
      const input = 'language_code_that_does_not_exist';

      expect(LanguageUtils.fromISO639_3(input)).toEqual(otherLanguageSchema);
    });

    it('should return language schema for the given a elastic language code', () => {
      const input = availableLanguages.find(language => Boolean(language.elastic));

      expect(LanguageUtils.fromElastic(input.elastic)).toEqual(input);
    });

    it('should return default language schema if given a elastic language code that does not exist on available languages', () => {
      const input = 'language_code_that_does_not_exist';

      expect(LanguageUtils.fromElastic(input)).toEqual(otherLanguageSchema);
    });

    it('should return language schema for the given a ISO639_1 language code', () => {
      const input = availableLanguages[0];

      expect(LanguageUtils.fromISO639_1(input.ISO639_1)).toEqual(input);
    });

    it('should return undefined if given a ISO639_1 language code that does not exist on available languages', () => {
      const input = 'language_code_that_does_not_exist';

      expect(LanguageUtils.fromISO639_1(input)).toBeUndefined();
    });
  });
});
