import {isClient} from 'app/utils';
import Cookie from 'tiny-cookie';

let I18NUtils = {
  getUrlLocale: (path, languages) => {
    return (languages.find((lang) => {
      let regexp = new RegExp(`^\/?${lang.key}\/|^\/?${lang.key}$`);
      return path.match(regexp);
    }) || {}).key;
  },

  getCoockieLocale: (cookie = {}) => {
    if (isClient && Cookie.get('locale')) {
      return Cookie.get('locale');
    }

    return cookie.locale;
  },

  getDefaultLocale: (languages) => {
    return (languages.find((language) => language.default) || {}).key;
  },

  getLocale: (path, languages = [], cookie = {}) => {
    return I18NUtils.getUrlLocale(path, languages) || I18NUtils.getCoockieLocale(cookie) || I18NUtils.getDefaultLocale(languages);
  },

  saveLocale: (locale) => {
    if (isClient) {
      return Cookie.set('locale', locale, {expires: 365 * 10});
    }
  }
};

export default I18NUtils;
