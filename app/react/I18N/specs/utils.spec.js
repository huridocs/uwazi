import utils from '../utils.js';

describe('I18NUtils', () => {
  describe('getLocale', () => {
    it('should return locale passed', () => {
      expect(utils.getLocale('es', [{ key: 'es' }])).toBe('es');
    });

    describe('when language passed does not exist', () => {
      it('should return default locale', () => {
        expect(utils.getLocale('es', [{ key: 'en', default: true }, { key: 'pt' }])).toBe('en');
      });
    });
  });
});
