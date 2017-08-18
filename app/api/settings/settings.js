import translations from 'api/i18n/translations';
import model from './settingsModel';

function saveLinksTranslations(newLinks = [], currentLinks = []) {
  let updatedTitles = {};
  let deletedLinks = [];

  currentLinks.forEach((link) => {
    let matchLink = newLinks.find((l) => link._id.equals(l._id));
    if (matchLink && matchLink.title !== link.title) {
      updatedTitles[link.title] = matchLink.title;
    }
    if (!matchLink) {
      deletedLinks.push(link.title);
    }
  });

  let values = newLinks.reduce((result, link) => {
    result[link.title] = link.title;
    return result;
  }, {});

  return translations.updateContext('Menu', 'Menu', updatedTitles, deletedLinks, values);
}

function saveFiltersTranslations(_newFilters = [], _currentFilters = []) {
  let newFilters = _newFilters.filter((item) => item.items);
  let currentFilters = _currentFilters.filter((item) => item.items);

  let updatedNames = {};
  let deletedFilters = [];

  currentFilters.forEach((filter) => {
    let matchFilter = newFilters.find((l) => l.id === filter.id);
    if (matchFilter && matchFilter.name !== filter.name) {
      updatedNames[filter.name] = matchFilter.name;
    }
    if (!matchFilter) {
      deletedFilters.push(filter.name);
    }
  });

  let values = newFilters.reduce((result, filter) => {
    result[filter.name] = filter.name;
    return result;
  }, {});

  return translations.updateContext('Filters', 'Filters', updatedNames, deletedFilters, values);
}

function removeTemplate(filters, templateId) {
  let filterTemplate = (_filter) => _filter.id !== templateId;
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
    .then((currentSettings) => {
      return saveLinksTranslations(settings.links, currentSettings.links)
      .then(() => saveFiltersTranslations(settings.filters, currentSettings.filters))
      .then(() => {
        settings._id = currentSettings._id;
        return model.save(settings);
      });
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
