import languages from '../languages';

describe('languages', () => {
  describe('detect', () => {
    it('should return the text language', () => {
      expect(languages.detect('de que color es el caballo blanco de santiago')).toBe('spanish');
      expect(languages.detect('what is the colour of the white horse of santiago')).toBe('english');
    });

    it('should return other when the language is not supported', () => {
      expect(languages.detect('color chIS Sargh santiago')).toBe('other');
      expect(languages.detect('sdgfghhg hgjk ljhgfhgjk ghgjh ghfdfgfartytuasd fjh fghjgjasd')).toBe('other');
    });
  });
});
