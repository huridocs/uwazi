import * as Cookie from 'tiny-cookie';
import { isClient } from 'app/utils';

const I18NUtils = {
  getLocaleIfExists: (locale, languages = []) => {
    if (!locale) {
      return null;
    }

    if (languages.find(l => l.key === locale)) {
      return locale;
    }

    return I18NUtils.getDefaultLocale(languages);
  },

  getCoockieLocale: (cookie = {}, languages) => {
    if (isClient && Cookie.get('locale')) {
      return I18NUtils.getLocaleIfExists(Cookie.get('locale'), languages);
    }

    return I18NUtils.getLocaleIfExists(cookie.locale, languages);
  },

  getDefaultLocale: languages => (languages.find(language => language.default) || {}).key,

  getLocale: (urlLanguage, languages = [], cookie = {}) => I18NUtils.getLocaleIfExists(urlLanguage, languages) ||
  I18NUtils.getCoockieLocale(cookie, languages) ||
  I18NUtils.getDefaultLocale(languages),

  saveLocale: (locale) => {
    if (isClient) {
      Cookie.set('locale', locale, { expires: 365 * 10 });
    }
  }
};

export default I18NUtils;
