import * as Cookie from 'tiny-cookie';
import * as appUtils from 'app/utils';

import utils from '../utils.js';

describe('I18NUtils', () => {
  let languages;

  beforeEach(() => {
    languages = [
      { key: 'en' },
      { key: 'es', default: true },
      { key: 'pt' },
    ];

    spyOn(Cookie, 'set');
  });

  const expectLanguage = (operation, language) => {
    expect(operation).toBe(language);
    expect(Cookie.set).toHaveBeenCalledWith('locale', language, { expires: 365 * 10 });
  };

  describe('If Client', () => {
    beforeEach(() => {
      appUtils.isClient = true;
    });

    describe('getLocale', () => {
      it('should return default locale and set cookie', () => {
        expectLanguage(utils.getLocale(null, languages), 'es');
      });

      it('should return previously set-in-cookie language and set cookie', () => {
        spyOn(Cookie, 'get').and.callFake(property => property === 'locale' ? 'en' : null);
        expectLanguage(utils.getLocale(null, languages), 'en');
      });

      it('should return url-set-language and set cookie', () => {
        expectLanguage(utils.getLocale('pt', languages), 'pt');
      });

      it('should return default / cookie language if URL language is not valid', () => {
        expectLanguage(utils.getLocale('ar', languages), 'es');

        spyOn(Cookie, 'get').and.callFake(property => property === 'locale' ? 'en' : null);
        expectLanguage(utils.getLocale('ar', languages), 'en');
      });
    });
  });
});
