import * as Cookie from 'tiny-cookie';
import { isClient } from 'app/utils';

const getURLLocale = (locale, languages = []) => languages.find(l => l.key === locale) ? locale : null;

const getCookieLocale = () => {
  if (isClient && Cookie.get('locale')) {
    return Cookie.get('locale');
  }

  return null;
  // return I18NUtils.getLocaleIfExists(cookie.locale, languages);
};

const getDefaultLocale = languages => (languages.find(language => language.default) || {}).key;

const I18NUtils = {
  getLocale(urlLanguage, languages = [], cookie = {}) {
    const newLanguage = getURLLocale(urlLanguage, languages) || getCookieLocale(cookie) || getDefaultLocale(languages);
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
