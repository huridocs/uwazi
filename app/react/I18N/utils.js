import * as Cookie from 'tiny-cookie';
import { isClient } from 'app/utils';

const languageInLanguages = (languages, locale) => Boolean(languages.find(l => l.key === locale));
const getURLLocale = (locale, languages = []) =>
  languageInLanguages(languages, locale) ? locale : null;
const getCookieLocale = (cookie, languages) =>
  cookie.locale && languageInLanguages(languages, cookie.locale) ? cookie.locale : null;
const getDefaultLocale = languages => (languages.find(language => language.default) || {}).key;

const I18NUtils = {
  getLocale(urlLanguage, languages, cookie = {}) {
    return (
      getURLLocale(urlLanguage, languages) ||
      getCookieLocale(cookie, languages) ||
      getDefaultLocale(languages)
    );
  },

  saveLocale: locale => {
    if (isClient) {
      Cookie.set('locale', locale, { expires: 365 * 10 });
    }
  },
};

export default I18NUtils;
