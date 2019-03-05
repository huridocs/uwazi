import translations from 'api/i18n/translations';

import model from './settingsModel';

function saveLinksTranslations(newLinks = [], currentLinks = []) {
  const updatedTitles = {};
  const deletedLinks = [];

  currentLinks.forEach((link) => {
    const matchLink = newLinks.find(l => link._id.equals(l._id));
    if (matchLink && matchLink.title !== link.title) {
      updatedTitles[link.title] = matchLink.title;
    }
    if (!matchLink) {
      deletedLinks.push(link.title);
    }
  });

  const values = newLinks.reduce((result, link) => {
    result[link.title] = link.title;
    return result;
  }, {});

  return translations.updateContext('Menu', 'Menu', updatedTitles, deletedLinks, values, 'Uwazi UI');
}

function saveFiltersTranslations(_newFilters = [], _currentFilters = []) {
  const newFilters = _newFilters.filter(item => item.items);
  const currentFilters = _currentFilters.filter(item => item.items);

  const updatedNames = {};
  const deletedFilters = [];

  currentFilters.forEach((filter) => {
    const matchFilter = newFilters.find(l => l.id === filter.id);
    if (matchFilter && matchFilter.name !== filter.name) {
      updatedNames[filter.name] = matchFilter.name;
    }
    if (!matchFilter) {
      deletedFilters.push(filter.name);
    }
  });

  const values = newFilters.reduce((result, filter) => {
    result[filter.name] = filter.name;
    return result;
  }, {});

  return translations.updateContext('Filters', 'Filters', updatedNames, deletedFilters, values, 'Uwazi UI');
}

function removeTemplate(filters, templateId) {
  const filterTemplate = _filter => _filter.id !== templateId;
  return filters
  .filter(filterTemplate)
  .map((_filter) => {
    if (_filter.items) {
      _filter.items = removeTemplate(_filter.items, templateId);
    }

    return _filter;
  });
}

export default {
  get() {
    return model.get().then(settings => settings[0] || {});
  },

  save(settings) {
    return this.get()
    .then(currentSettings => saveLinksTranslations(settings.links, currentSettings.links)
    .then(() => saveFiltersTranslations(settings.filters, currentSettings.filters))
    .then(() => {
      settings._id = currentSettings._id;
      return model.save(settings);
    }));
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

  removeTemplateFromFilters(templateId) {
    return this.get()
    .then((settings) => {
      if (!settings.filters) {
        return;
      }

      settings.filters = removeTemplate(settings.filters, templateId);
      return this.save(settings);
    });
  }
};
