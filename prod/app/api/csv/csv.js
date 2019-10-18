"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _csvtojson = _interopRequireDefault(require("csvtojson"));

var _languagesList = require("../../shared/languagesList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const csv = (readStream, stopOnError = false) => ({
  onRow(onRowCallback) {
    this.onRowCallback = onRowCallback;
    return this;
  },

  onError(onErrorCallback) {
    this.onErrorCallback = onErrorCallback;
    return this;
  },

  async read() {
    return new Promise((resolve, reject) => {
      (0, _csvtojson.default)({ delimiter: [',', ';'] }).
      fromStream(readStream).
      subscribe(async (row, index) => {
        try {
          await this.onRowCallback(row, index);
        } catch (e) {
          if (stopOnError) {
            readStream.unpipe();
            readStream.destroy();
            resolve();
          }

          this.onErrorCallback(e, row, index);
        }
      }, reject, resolve);
    });
  },

  async toThesauri(language, availableLanguages) {
    const values = await (0, _csvtojson.default)({ delimiter: [',', ';'] }).fromStream(readStream);
    const languageLabel = _languagesList.allLanguages.find(l => l.key === language).label;

    const languagesToTranslate = _languagesList.allLanguages.
    filter(
    (l) =>
    availableLanguages.includes(l.key) &&
    Object.keys(values[0]).includes(l.label)).

    reduce((map, lang) => _objectSpread({}, map, { [lang.key]: lang.label }), {});

    return {
      thesauriValues: values.map(v => ({ label: v[languageLabel] })),

      thesauriTranslations: Object.keys(languagesToTranslate).reduce((translations, lang) => {
        translations[lang] = values.map(t => ({ // eslint-disable-line no-param-reassign
          key: t[languageLabel],
          value: t[languagesToTranslate[lang]] }));


        return translations;
      }, {}) };

  } });var _default =


csv;exports.default = _default;