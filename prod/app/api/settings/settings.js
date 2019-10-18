"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _translations = _interopRequireDefault(require("../i18n/translations"));

var _settingsModel = _interopRequireDefault(require("./settingsModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const getUpdatesAndDeletes = (newValues, currentValues, matchProperty, propertyName) => {
  const updatedValues = {};
  const deletedValues = [];

  currentValues.forEach(value => {
    const matchValue = newValues.find(v => v[matchProperty] && v[matchProperty].toString() === value[matchProperty].toString());
    if (matchValue && matchValue[propertyName] !== value[propertyName]) {
      updatedValues[value[propertyName]] = matchValue[propertyName];
    }
    if (!matchValue) {
      deletedValues.push(value[propertyName]);
    }
  });

  const values = newValues.reduce((result, value) => Object.assign({}, result, { [value[propertyName]]: value[propertyName] }), {});

  return { updatedValues, deletedValues, values };
};

function saveLinksTranslations(newLinks, currentLinks = []) {
  if (!newLinks) {return Promise.resolve();}

  const { updatedValues, deletedValues, values } = getUpdatesAndDeletes(newLinks, currentLinks, '_id', 'title');
  return _translations.default.updateContext('Menu', 'Menu', updatedValues, deletedValues, values, 'Uwazi UI');
}

function saveFiltersTranslations(_newFilters, _currentFilters = []) {
  if (!_newFilters) {return Promise.resolve();}

  const newFilters = _newFilters.filter(item => item.items);
  const currentFilters = _currentFilters.filter(item => item.items);

  const { updatedValues, deletedValues, values } = getUpdatesAndDeletes(newFilters, currentFilters, 'id', 'name');
  return _translations.default.updateContext('Filters', 'Filters', updatedValues, deletedValues, values, 'Uwazi UI');
}

function removeTemplate(filters, templateId) {
  const filterTemplate = filter => filter.id !== templateId;
  return filters.
  filter(filterTemplate).
  map(_filter => {
    const filter = _filter;
    if (filter.items) {
      filter.items = removeTemplate(filter.items, templateId);
    }
    return filter;
  });
}var _default =

{
  get(selectPrivateValues = false) {
    const select = selectPrivateValues ? '+publicFormDestination' : '';
    return _settingsModel.default.get(null, select).then(settings => settings[0] || {});
  },

  async save(settings) {
    const currentSettings = await this.get();
    await saveLinksTranslations(settings.links, currentSettings.links);
    await saveFiltersTranslations(settings.filters, currentSettings.filters);
    return _settingsModel.default.save(Object.assign({}, settings, { _id: currentSettings._id }));
  },

  setDefaultLanguage(key) {
    return this.get().
    then(currentSettings => {
      const languages = currentSettings.languages.map(_language => {
        const language = Object.assign({}, _language);
        language.default = language.key === key;
        return language;
      });

      return _settingsModel.default.save(Object.assign(currentSettings, { languages }));
    });
  },

  addLanguage(language) {
    return this.get().
    then(currentSettings => {
      currentSettings.languages.push(language);
      return _settingsModel.default.save(currentSettings);
    });
  },

  deleteLanguage(key) {
    return this.get().
    then(currentSettings => {
      const languages = currentSettings.languages.filter(language => language.key !== key);
      return _settingsModel.default.save(Object.assign(currentSettings, { languages }));
    });
  },

  async removeTemplateFromFilters(templateId) {
    const settings = await this.get();

    if (!settings.filters) {
      return Promise.resolve();
    }

    settings.filters = removeTemplate(settings.filters, templateId);
    return this.save(settings);
  },

  async updateFilterName(filterId, name) {
    const settings = await this.get();

    if (!settings.filters.some(eachFilter => eachFilter.id === filterId)) {
      return Promise.resolve();
    }

    settings.filters.find(eachFilter => eachFilter.id === filterId).name = name;
    return this.save(settings);
  } };exports.default = _default;