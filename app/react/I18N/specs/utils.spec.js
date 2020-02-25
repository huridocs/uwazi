import * as Cookie from 'tiny-cookie';
import * as appUtils from 'app/utils';

import utils from '../utils.js';

describe('I18NUtils', () => {
  let languages;

  beforeEach(() => {
    languages = [{ key: 'en' }, { key: 'es', default: true }, { key: 'pt' }];
  });

  describe('getLocale', () => {
    it('should return default locale', () => {
      expect(utils.getLocale(null, languages)).toBe('es');
    });

    it('should return previously set-in-cookie language', () => {
      expect(utils.getLocale(null, languages, { locale: 'en' })).toBe('en');
    });

    it('should return default if previously set-in-cookie language is not valid', () => {
      expect(utils.getLocale(null, languages, { locale: 'md' })).toBe('es');
    });

    it('should return url-set-language', () => {
      expect(utils.getLocale('pt', languages)).toBe('pt');
    });

    it('should return default / cookie language if URL language is not valid', () => {
      expect(utils.getLocale('ar', languages)).toBe('es');
      expect(utils.getLocale('ar', languages, { locale: 'en' })).toBe('en');
    });
  });

  describe('saveLocale', () => {
    beforeEach(() => {
      spyOn(Cookie, 'set');
    });

    it('should set the cookie locale', () => {
      appUtils.isClient = true;
      utils.saveLocale('tr');
      expect(Cookie.set).toHaveBeenCalledWith('locale', 'tr', { expires: 365 * 10 });
      utils.saveLocale('es');
      expect(Cookie.set).toHaveBeenCalledWith('locale', 'es', { expires: 365 * 10 });
    });

    it('should not attempt to save cookie on server', () => {
      appUtils.isClient = false;
      utils.saveLocale('tr');
      expect(Cookie.set).not.toHaveBeenCalled();
    });
  });
});
