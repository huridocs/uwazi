"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var Cookie = _interopRequireWildcard(require("tiny-cookie"));
var _utils = require("../utils");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const languageInLanguages = (languages, locale) => Boolean(languages.find(l => l.key === locale));
const getURLLocale = (locale, languages = []) => languageInLanguages(languages, locale) ? locale : null;
const getCookieLocale = (cookie, languages) => cookie.locale && languageInLanguages(languages, cookie.locale) ? cookie.locale : null;
const getDefaultLocale = languages => (languages.find(language => language.default) || {}).key;

const I18NUtils = {
  getLocale(urlLanguage, languages, cookie = {}) {
    return getURLLocale(urlLanguage, languages) || getCookieLocale(cookie, languages) || getDefaultLocale(languages);
  },

  saveLocale: locale => {
    if (_utils.isClient) {
      Cookie.set('locale', locale, { expires: 365 * 10 });
    }
  } };var _default =


I18NUtils;exports.default = _default;