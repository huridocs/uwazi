"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _settings = _interopRequireDefault(require("../settings/settings"));

var _translationsModel = _interopRequireDefault(require("./translationsModel.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function prepareContexts(contexts) {
  return contexts.map(context => _objectSpread({},
  context, {
    type: context.id === 'System' || context.id === 'Filters' || context.id === 'Menu' ? 'Uwazi UI' : context.type,
    values: context.values ? context.values.reduce((values, value) => {
      values[value.key] = value.value; //eslint-disable-line no-param-reassign
      return values;
    }, {}) : {} }));

}

function processContextValues(context) {
  let values;
  if (context.values && !Array.isArray(context.values)) {
    values = [];
    Object.keys(context.values).forEach(key => {
      values.push({ key, value: context.values[key] });
    });
  }

  return _objectSpread({}, context, { values: values || context.values });
}

function update(translation) {
  return _translationsModel.default.getById(translation._id).
  then(currentTranslationData => {
    currentTranslationData.contexts.forEach(context => {
      const isPresentInTheComingData = translation.contexts.find(_context => _context.id === context.id);
      if (!isPresentInTheComingData) {
        translation.contexts.push(context);
      }
    });

    return _translationsModel.default.save(_objectSpread({}, translation, { contexts: translation.contexts.map(processContextValues) }));
  });
}var _default =

{
  prepareContexts,
  get() {
    return _translationsModel.default.get().
    then(response => response.map(translation => _objectSpread({}, translation, { contexts: prepareContexts(translation.contexts) })));
  },

  save(translation) {
    if (translation._id) {
      return update(translation);
    }

    return _translationsModel.default.save(_objectSpread({}, translation, { contexts: translation.contexts && translation.contexts.map(processContextValues) }));
  },

  addEntry(contextId, key, defaultValue) {
    return _translationsModel.default.get().
    then(result => Promise.all(result.map(translation => {
      const context = translation.contexts.find(ctx => ctx.id === contextId);
      if (!context) {
        return Promise.resolve();
      }
      context.values = context.values || [];
      context.values.push({ key, value: defaultValue });
      return this.save(translation);
    }))).
    then(() => 'ok');
  },

  addContext(id, contextName, values, type) {
    const translatedValues = [];
    Object.keys(values).forEach(key => {
      translatedValues.push({ key, value: values[key] });
    });
    return _translationsModel.default.get().
    then(result => Promise.all(result.map(translation => {
      translation.contexts.push({ id, label: contextName, values: translatedValues, type });
      return this.save(translation);
    }))).
    then(() => 'ok');
  },

  deleteContext(id) {
    return _translationsModel.default.get().
    then(result => Promise.all(result.map(translation => _translationsModel.default.save(_objectSpread({}, translation, { contexts: translation.contexts.filter(tr => tr.id !== id) }))))).
    then(() => 'ok');
  },

  processSystemKeys(keys) {
    return _translationsModel.default.get().
    then(languages => {
      let existingKeys = languages[0].contexts.find(c => c.label === 'System').values;
      const newKeys = keys.map(k => k.key);
      const keysToAdd = [];
      keys.forEach(key => {
        if (!existingKeys.find(k => key.key === k.key)) {
          keysToAdd.push({ key: key.key, value: key.label || key.key });
        }
      });

      languages.forEach(language => {
        let system = language.contexts.find(c => c.label === 'System');
        if (!system) {
          system = {
            id: 'System',
            label: 'System',
            values: keys.map(k => ({ key: k.key, value: k.label || k.key })) };

          language.contexts.unshift(system);
        }
        existingKeys = system.values;
        const valuesWithRemovedValues = existingKeys.filter(i => newKeys.includes(i.key));
        system.values = valuesWithRemovedValues.concat(keysToAdd);
      });

      return _translationsModel.default.save(languages);
    });
  },

  updateContext(id, newContextName, keyNamesChanges, deletedProperties, values, type) {
    const translatedValues = [];
    Object.keys(values).forEach(key => {
      translatedValues.push({ key, value: values[key] });
    });

    return Promise.all([_translationsModel.default.get(), _settings.default.get()]).
    then(([translations, siteSettings]) => {
      const defaultLanguage = siteSettings.languages.find(lang => lang.default).key;
      return Promise.all(translations.map(translation => {
        const context = translation.contexts.find(tr => tr.id.toString() === id.toString());
        if (!context) {
          translation.contexts.push({ id, label: newContextName, values: translatedValues, type });
          return this.save(translation);
        }

        context.values = context.values || [];
        context.values = context.values.filter(v => !deletedProperties.includes(v.key));
        context.type = type;

        Object.keys(keyNamesChanges).forEach(originalKey => {
          const newKey = keyNamesChanges[originalKey];
          const value = context.values.find(v => v.key === originalKey);
          if (value) {
            value.key = newKey;

            if (translation.locale === defaultLanguage) {
              value.value = newKey;
            }
          }
          if (!value) {
            context.values.push({ key: newKey, value: values[newKey] });
          }
        });

        Object.keys(values).forEach(key => {
          if (!context.values.find(v => v.key === key)) {
            context.values.push({ key, value: values[key] });
          }
        });

        context.label = newContextName;

        return this.save(translation);
      }));
    }).
    then(() => 'ok');
  },

  async addLanguage(language) {
    const [lanuageTranslationAlreadyExists] = await _translationsModel.default.get({ locale: language });
    if (lanuageTranslationAlreadyExists) {
      return Promise.resolve();
    }

    const { languages } = await _settings.default.get();

    const [defaultTranslation] = await _translationsModel.default.get({ locale: languages.find(l => l.default).key });

    return _translationsModel.default.save(_objectSpread({},
    defaultTranslation, {
      _id: null,
      locale: language,
      contexts: defaultTranslation.contexts.map((_ref) => {let { _id } = _ref,context = _objectWithoutProperties(_ref, ["_id"]);return context;}) }));

  },

  async removeLanguage(language) {
    return _translationsModel.default.delete({ locale: language });
  } };exports.default = _default;