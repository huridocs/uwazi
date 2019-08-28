import translations from 'api/i18n/translations';

import model from './settingsModel';

const getUpdatesAndDeletes = (newValues, currentValues, matchProperty, propertyName) => {
  const updatedValues = {};
  const deletedValues = [];

  currentValues.forEach((value) => {
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
  if (!newLinks) { return Promise.resolve(); }

  const { updatedValues, deletedValues, values } = getUpdatesAndDeletes(newLinks, currentLinks, '_id', 'title');
  return translations.updateContext('Menu', 'Menu', updatedValues, deletedValues, values, 'Uwazi UI');
}

function saveFiltersTranslations(_newFilters, _currentFilters = []) {
  if (!_newFilters) { return Promise.resolve(); }

  const newFilters = _newFilters.filter(item => item.items);
  const currentFilters = _currentFilters.filter(item => item.items);

  const { updatedValues, deletedValues, values } = getUpdatesAndDeletes(newFilters, currentFilters, 'id', 'name');
  return translations.updateContext('Filters', 'Filters', updatedValues, deletedValues, values, 'Uwazi UI');
}

function removeTemplate(filters, templateId) {
  const filterTemplate = filter => filter.id !== templateId;
  return filters
  .filter(filterTemplate)
  .map((_filter) => {
    const filter = _filter;
    if (filter.items) {
      filter.items = removeTemplate(filter.items, templateId);
    }
    return filter;
  });
}

export default {
  get(selectPrivateValues = false) {
    const select = selectPrivateValues ? '+publicFormDestination' : '';
    return model.get(null, select).then(settings => settings[0] || {});
  },

  async save(settings) {
    const currentSettings = await this.get();
    await saveLinksTranslations(settings.links, currentSettings.links);
    await saveFiltersTranslations(settings.filters, currentSettings.filters);
    return model.save(Object.assign({}, settings, { _id: currentSettings._id }));
  },

  setDefaultLanguage(key) {
    return this.get()
    .then((currentSettings) => {
      const languages = currentSettings.languages.map((_language) => {
        const language = Object.assign({}, _language);
        language.default = language.key === key;
        return language;
      });

      return model.save(Object.assign(currentSettings, { languages }));
    });
  },

  addLanguage(language) {
    return this.get()
    .then((currentSettings) => {
      currentSettings.languages.push(language);
      return model.save(currentSettings);
    });
  },

  deleteLanguage(key) {
    return this.get()
    .then((currentSettings) => {
      const languages = currentSettings.languages.filter(language => language.key !== key);
      return model.save(Object.assign(currentSettings, { languages }));
    });
  },

  async removeTemplateFromFilters(templateId) {
    const settings = await this.get();

    if (!settings.filters) {
      return Promise.resolve();
    }

    settings.filters = removeTemplate(settings.filters, templateId);
    return this.save(settings);
  }
};
