import { fromJS } from 'immutable';
import { shouldDisplayTranslation } from '../shouldDisplayTranslation';

let mockTranslationReturn = '';

jest.mock('app/I18N', () => ({
  t: () => mockTranslationReturn,
}));

describe('Should display translation', () => {
  const availableLanguages = fromJS([
    { _id: '1', label: 'English', key: 'en', default: true },
    { _id: '1', label: 'Spanish', key: 'es' },
  ]);

  describe('default language', () => {
    it('should return false when the translation matches', () => {
      mockTranslationReturn = 'Original name';
      const result = shouldDisplayTranslation('Original name', 'n/a', 'en', availableLanguages);

      expect(result).toBe(false);
    });

    it('should return true when the translation is different', () => {
      mockTranslationReturn = 'A different translation';
      const result = shouldDisplayTranslation('Original name', 'n/a', 'en', availableLanguages);

      expect(result).toBe(true);
    });
  });

  describe('other languages', () => {
    it('should always return true', () => {
      mockTranslationReturn = 'Original name';
      let result = shouldDisplayTranslation('Original name', 'n/a', 'es', availableLanguages);

      expect(result).toBe(true);

      mockTranslationReturn = 'A different translation';
      result = shouldDisplayTranslation('Original name', 'n/a', 'es', availableLanguages);

      expect(result).toBe(true);
    });
  });
});
