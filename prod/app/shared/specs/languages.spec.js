"use strict";var _languages = _interopRequireDefault(require("../languages"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('languages', () => {
  describe('getAll', () => {
    it('should return a list of all languages for the default purpose', () => {
      expect(_languages.default.getAll().length).toBe(32);
      expect(_languages.default.getAll()[0]).toBe('arabic');
    });

    it('should return a list of all languages for the passed purpose', () => {
      expect(_languages.default.getAll('ISO639_1').length).toBe(31);
      expect(_languages.default.getAll('ISO639_1')[5]).toBe(_languages.default.data[7].ISO639_1);
      expect(_languages.default.getAll('franc').length).toBe(33);
      expect(_languages.default.getAll('franc')[5]).toBe(_languages.default.data[5].franc);
    });
  });

  describe('get', () => {
    it('should return a match for the key for the default purpose', () => {
      expect(_languages.default.get('glg')).toBe('galician');
      expect(_languages.default.get('lav')).toBe('latvian');
    });

    it('should return a match for the key for the passed purpose', () => {
      expect(_languages.default.get('glg', 'ISO639_1')).toBe('gl');
      expect(_languages.default.get('lav', 'ISO639_1')).toBe('lv');
    });

    it('should return other for a key in a non supported lang', () => {
      expect(_languages.default.get('und')).toBe('other');
    });

    it('should return null for a key in a non supported lang when asking for ISO639_1', () => {
      expect(_languages.default.get('und', 'ISO639_1')).toBe(null);
    });
  });

  describe('detect', () => {
    it('should return the text language (for elasticsearch by default)', () => {
      expect(_languages.default.detect('de que color es el caballo blanco de santiago')).toBe('spanish');
      expect(_languages.default.detect('what is the colour of the white horse of santiago')).toBe('english');
    });

    it('should return the text language for a specific purpose if selected', () => {
      expect(_languages.default.detect('de que color es el caballo blanco de santiago', 'ISO639_1')).toBe('es');
      expect(_languages.default.detect('what is the colour of the white horse of santiago', 'ISO639_1')).toBe('en');
      expect(_languages.default.detect('de que color es el caballo blanco de santiago', 'franc')).toBe('spa');
      expect(_languages.default.detect('what is the colour of the white horse of santiago', 'franc')).toBe('eng');
    });

    it('should return other when the language is not supported', () => {
      expect(_languages.default.detect('color chIS Sargh santiago')).toBe('other');
      expect(_languages.default.detect('sdgfghhg hgjk ljhgfhgjk ghgjh ghfdfgfartytuasd fjh fghjgjasd')).toBe('other');
    });
  });
});