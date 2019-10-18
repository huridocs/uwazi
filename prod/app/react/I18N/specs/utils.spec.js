"use strict";var Cookie = _interopRequireWildcard(require("tiny-cookie"));
var appUtils = _interopRequireWildcard(require("../../utils"));

var _utils2 = _interopRequireDefault(require("../utils.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('I18NUtils', () => {
  let languages;

  beforeEach(() => {
    languages = [
    { key: 'en' },
    { key: 'es', default: true },
    { key: 'pt' }];

  });

  describe('getLocale', () => {
    it('should return default locale', () => {
      expect(_utils2.default.getLocale(null, languages)).toBe('es');
    });

    it('should return previously set-in-cookie language', () => {
      expect(_utils2.default.getLocale(null, languages, { locale: 'en' })).toBe('en');
    });

    it('should return default if previously set-in-cookie language is not valid', () => {
      expect(_utils2.default.getLocale(null, languages, { locale: 'md' })).toBe('es');
    });

    it('should return url-set-language', () => {
      expect(_utils2.default.getLocale('pt', languages)).toBe('pt');
    });

    it('should return default / cookie language if URL language is not valid', () => {
      expect(_utils2.default.getLocale('ar', languages)).toBe('es');
      expect(_utils2.default.getLocale('ar', languages, { locale: 'en' })).toBe('en');
    });
  });

  describe('saveLocale', () => {
    beforeEach(() => {
      spyOn(Cookie, 'set');
    });

    it('should set the cookie locale', () => {
      appUtils.isClient = true;
      _utils2.default.saveLocale('tr');
      expect(Cookie.set).toHaveBeenCalledWith('locale', 'tr', { expires: 365 * 10 });
      _utils2.default.saveLocale('es');
      expect(Cookie.set).toHaveBeenCalledWith('locale', 'es', { expires: 365 * 10 });
    });

    it('should not attempt to save cookie on server', () => {
      appUtils.isClient = false;
      _utils2.default.saveLocale('tr');
      expect(Cookie.set).not.toHaveBeenCalled();
    });
  });
});