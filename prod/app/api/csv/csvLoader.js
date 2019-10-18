"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _events = _interopRequireDefault(require("events"));

var _templates = _interopRequireDefault(require("../templates"));
var _settings = _interopRequireDefault(require("../settings"));
var _i18n = _interopRequireDefault(require("../i18n"));
var _translationsModel = _interopRequireDefault(require("../i18n/translationsModel"));
var _thesauris = _interopRequireDefault(require("../thesauris"));

var _csv = _interopRequireDefault(require("./csv"));
var _importFile = _interopRequireDefault(require("./importFile"));
var _importEntity = require("./importEntity");
var _entityRow = require("./entityRow");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

class CSVLoader extends _events.default {
  constructor(options = { stopOnError: true }) {
    super();
    this._errors = {};
    this.stopOnError = options.stopOnError;
  }

  errors() {
    return this._errors;
  }

  async load(csvPath, templateId, options = { language: 'en' }) {
    const template = await _templates.default.getById(templateId);
    const file = (0, _importFile.default)(csvPath);
    const availableLanguages = (await _settings.default.get()).languages.map(l => l.key);

    await (0, _csv.default)((await file.readStream()), this.stopOnError).
    onRow(async row => {
      const { rawEntity, rawTranslations } =
      (0, _entityRow.extractEntity)(row, availableLanguages, options.language);

      const entity = await (0, _importEntity.importEntity)(rawEntity, template, file, options);
      if (rawTranslations.length) {
        await (0, _importEntity.translateEntity)(entity, rawTranslations, template, file);
      }
      this.emit('entityLoaded', entity);
    }).
    onError((e, row, index) => {
      this._errors[index] = e;
      this.emit('loadError', e, (0, _entityRow.toSafeName)(row), index);
    }).
    read();

    if (Object.keys(this._errors).length === 1) {
      throw this._errors[0];
    }

    if (Object.keys(this._errors).length) {
      throw new Error('multiple errors ocurred !');
    }
  }

  async loadThesauri(csvPath, thesauriId, { language }) {//eslint-disable-line class-methods-use-this
    const file = (0, _importFile.default)(csvPath);
    const availableLanguages = (await _settings.default.get()).languages.map(l => l.key).filter(l => l !== language);
    const { thesauriValues, thesauriTranslations } = await (0, _csv.default)((await file.readStream())).toThesauri(language, availableLanguages);

    const thesauri = await _thesauris.default.getById(thesauriId);
    const saved = await _thesauris.default.save(_objectSpread({}, thesauri, { values: [...thesauri.values, ...thesauriValues] }));

    await Object.keys(thesauriTranslations).reduce(async (prev, lang) => {
      await prev;
      const translationValues = thesauriTranslations[lang];
      const [currentTranslation] = await _translationsModel.default.get({ locale: lang });
      const currentContext = currentTranslation.contexts.find(c => c.id.toString() === thesauriId.toString());

      return _i18n.default.save(_objectSpread({},
      currentTranslation, {
        contexts: [_objectSpread({},

        currentContext, {
          values: [...currentContext.values, ...translationValues] })] }));



    }, Promise.resolve());
    return saved;
  }}exports.default = CSVLoader;