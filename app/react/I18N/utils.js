import * as Cookie from 'tiny-cookie';
import { isClient } from 'app/utils';

const I18NUtils = {
  getURLLocale: (locale, languages = []) => languages.find(l => l.key === locale) ? locale : null,

  getCookieLocale: () => {
    if (isClient && Cookie.get('locale')) {
      return Cookie.get('locale');
    }

    return null;
    // return I18NUtils.getLocaleIfExists(cookie.locale, languages);
  },

  getDefaultLocale: languages => (languages.find(language => language.default) || {}).key,

  getLocale(urlLanguage, languages = [], cookie = {}) {
    const newLanguage = I18NUtils.getURLLocale(urlLanguage, languages) ||
                        I18NUtils.getCookieLocale(cookie) ||
                        I18NUtils.getDefaultLocale(languages);
    this.saveLocale(newLanguage);
    return newLanguage;
  },

  saveLocale: (locale) => {
    if (isClient) {
      Cookie.set('locale', locale, { expires: 365 * 10 });
    }
  }
};

export default I18NUtils;
