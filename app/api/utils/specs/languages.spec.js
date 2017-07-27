import languages from '../languages';

describe('languages', () => {
  describe('getAll', () => {
    it('should return a list of all languages for the default purpose', () => {
      expect(languages.getAll().length).toBe(32);
      expect(languages.getAll()[0]).toBe('arabic');
    });

    it('should return a list of all languages for the passed purpose', () => {
      expect(languages.getAll('ISO639_1').length).toBe(31);
      expect(languages.getAll('ISO639_1')[0]).toBe('ar');
    });
  });

  describe('detect', () => {
    it('should return the text language (for elasticsearch by default)', () => {
      expect(languages.detect('de que color es el caballo blanco de santiago')).toBe('spanish');
      expect(languages.detect('what is the colour of the white horse of santiago')).toBe('english');
    });

    it('should return the text language for a specific purpose if selected', () => {
      expect(languages.detect('de que color es el caballo blanco de santiago', 'ISO639_1')).toBe('es');
      expect(languages.detect('what is the colour of the white horse of santiago', 'ISO639_1')).toBe('en');
    });

    it('should return other when the language is not supported', () => {
      expect(languages.detect('color chIS Sargh santiago')).toBe('other');
      expect(languages.detect('sdgfghhg hgjk ljhgfhgjk ghgjh ghfdfgfartytuasd fjh fghjgjasd')).toBe('other');
    });
  });
});
