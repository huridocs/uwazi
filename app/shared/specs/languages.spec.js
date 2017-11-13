import languages from '../languages';

describe('languages', () => {
  describe('getAll', () => {
    it('should return a list of all languages for the default purpose', () => {
      expect(languages.getAll().length).toBe(32);
      expect(languages.getAll()[0]).toBe('arabic');
    });

    it('should return a list of all languages for the passed purpose', () => {
      expect(languages.getAll('ISO639_1').length).toBe(31);
      expect(languages.getAll('ISO639_1')[5]).toBe(languages.data[7].ISO639_1);
      expect(languages.getAll('franc').length).toBe(33);
      expect(languages.getAll('franc')[5]).toBe(languages.data[5].franc);
    });
  });

  describe('get', () => {
    it('should return a match for the key for the default purpose', () => {
      expect(languages.get('glg')).toBe('galician');
      expect(languages.get('lav')).toBe('latvian');
    });

    it('should return a match for the key for the passed purpose', () => {
      expect(languages.get('glg', 'ISO639_1')).toBe('gl');
      expect(languages.get('lav', 'ISO639_1')).toBe('lv');
    });

    it('should return other for a key in a non supported lang', () => {
      expect(languages.get('und')).toBe('other');
    });

    it('should return null for a key in a non supported lang when asking for ISO639_1', () => {
      expect(languages.get('und', 'ISO639_1')).toBe(null);
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
      expect(languages.detect('de que color es el caballo blanco de santiago', 'franc')).toBe('spa');
      expect(languages.detect('what is the colour of the white horse of santiago', 'franc')).toBe('eng');
    });

    it('should return other when the language is not supported', () => {
      expect(languages.detect('color chIS Sargh santiago')).toBe('other');
      expect(languages.detect('sdgfghhg hgjk ljhgfhgjk ghgjh ghfdfgfartytuasd fjh fghjgjasd')).toBe('other');
    });
  });
});
