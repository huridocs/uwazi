import translations from 'api/i18n/translations';

import { Settings, SettingsLinkSchema, SettingsFilterSchema } from 'shared/types/settingsType';
import { ensure } from 'shared/tsUtils';
import templates from 'api/templates';
import { LanguageSchema, LatLonSchema, ObjectIdSchema } from 'shared/types/commonTypes';

import { TemplateSchema } from 'shared/types/templateType';
import { validateSettings } from 'shared/types/settingsSchema';
import { ContextType } from 'shared/translationSchema';
import { settingsModel } from './settingsModel';

const DEFAULT_MAP_STARTING_POINT: LatLonSchema[] = [{ lon: 6, lat: 46 }];

const getUpdatesAndDeletes = (
  matchProperty: keyof (SettingsLinkSchema & SettingsFilterSchema),
  propertyName: keyof (SettingsLinkSchema & SettingsFilterSchema),
  newValues: (SettingsLinkSchema & SettingsFilterSchema)[] = [],
  currentValues: (SettingsLinkSchema & SettingsFilterSchema)[] = []
) => {
  const updatedValues: { [k: string]: any } = {};
  const deletedValues: string[] = [];

  currentValues.forEach((value: SettingsFilterSchema & SettingsLinkSchema) => {
    const matchValue = newValues.find(
      v => v[matchProperty] && v[matchProperty]?.toString() === value[matchProperty]?.toString()
    );

    if (value[propertyName] && matchValue && matchValue[propertyName] !== value[propertyName]) {
      if (value.sublinks) {
        value.sublinks.forEach(sublink => {
          updatedValues[ensure<string>(sublink[propertyName])] = sublink[propertyName];
        });
      }
      updatedValues[ensure<string>(value[propertyName])] = matchValue[propertyName];
    }
    if (!matchValue) {
      if (value.sublinks) {
        value.sublinks.forEach(sublink => {
          if (sublink[propertyName]) {
            deletedValues.push(ensure<string>(sublink[propertyName] as string));
          }
        });
      }
      deletedValues.push(ensure<string>(value[propertyName]));
    }
  });

  const values = newValues.reduce<{ [k: string]: string }>((result, value) => {
    const sublinkResults: { [key: string]: string | unknown } = {};
    value.sublinks?.map(sublink => {
      sublinkResults[ensure<string>(sublink[propertyName])] = sublink[propertyName];
    });
    return {
      ...result,
      [ensure<string>(value[propertyName])]: value[propertyName],
      ...sublinkResults,
    } as { [k: string]: string };
  }, {});
  return { updatedValues, deletedValues, values };
};

const saveLinksTranslations = async (
  newLinks: Settings['links'],
  currentLinks: Settings['links'] = []
) => {
  if (!newLinks) {
    return Promise.resolve();
  }

  const { updatedValues, deletedValues, values } = getUpdatesAndDeletes(
    '_id',
    'title',
    newLinks,
    currentLinks
  );

  return translations.updateContext(
    { id: 'Menu', label: 'Menu', type: ContextType.uwaziUI },
    updatedValues,
    deletedValues,
    values
  );
};

const saveFiltersTranslations = async (
  _newFilters: Settings['filters'],
  _currentFilters: Settings['filters'] = []
) => {
  if (!_newFilters) {
    return Promise.resolve();
  }

  const newFilters = _newFilters.filter(item => item.items);
  const currentFilters = _currentFilters.filter(item => item.items);

  const { updatedValues, deletedValues, values } = getUpdatesAndDeletes(
    'id',
    'name',
    newFilters,
    currentFilters
  );
  return translations.updateContext(
    { id: 'Filters', label: 'Filters', type: ContextType.uwaziUI },
    updatedValues,
    deletedValues,
    values
  );
};

function removeTemplate(filters: SettingsFilterSchema[], templateId: ObjectIdSchema) {
  const filterTemplate = (filter: SettingsFilterSchema) => filter.id !== templateId;
  return filters.filter(filterTemplate).map(_filter => {
    const filter = _filter;
    if (filter.items) {
      filter.items = removeTemplate(filter.items, templateId);
    }
    return filter;
  });
}

function setDefaults(storedSettings: Settings[]) {
  const [settings] = storedSettings;
  if (!settings) return {};

  settings.mapStartingPoint =
    settings.mapStartingPoint && settings.mapStartingPoint.length
      ? settings.mapStartingPoint
      : DEFAULT_MAP_STARTING_POINT;

  return settings;
}

export default {
  async get(query: any = {}, select: any = '') {
    return ensure<Settings>(
      await settingsModel.get(query, select).then(settings => setDefaults(settings))
    );
  },

  async save(settings: Settings) {
    await validateSettings(settings);
    const currentSettings = await this.get();
    await saveLinksTranslations(settings.links, currentSettings.links);
    await saveFiltersTranslations(settings.filters, currentSettings.filters);

    const result = await settingsModel.save({ ...settings, _id: currentSettings._id });

    if (!currentSettings.newNameGeneration && settings.newNameGeneration) {
      await (
        await templates.get()
      ).reduce<Promise<TemplateSchema>>(
        async (lastSave, template) => {
          await lastSave;
          return templates.save(
            template,
            ensure<LanguageSchema>(
              ensure<LanguageSchema[]>(currentSettings.languages).find(l => l.default)
            ).key
          );
        },
        Promise.resolve({} as TemplateSchema)
      );
    }

    return result;
  },

  async setDefaultLanguage(key: string) {
    return this.get().then(async currentSettings => {
      const languages = ensure<LanguageSchema[]>(currentSettings.languages).map(language => ({
        ...language,
        default: language.key === key,
      }));

      return settingsModel.save(Object.assign(currentSettings, { languages }));
    });
  },

  async getDefaultLanguage() {
    const currentSettings = await this.get();
    const defaultLanguage = currentSettings.languages?.find(language => language.default);
    if (!defaultLanguage) {
      throw new Error('There is no default language !');
    }
    return defaultLanguage;
  },

  async addLanguage(language: LanguageSchema) {
    const currentSettings = await this.get();
    currentSettings.languages = currentSettings.languages || [];
    currentSettings.languages.push(language);
    return settingsModel.save(currentSettings);
  },

  async deleteLanguage(key: string) {
    const currentSettings = await this.get();
    const languages = ensure<LanguageSchema[]>(currentSettings.languages).filter(
      language => language.key !== key
    );
    return settingsModel.save(Object.assign(currentSettings, { languages }));
  },

  async removeTemplateFromFilters(templateId: ObjectIdSchema) {
    const settings = await this.get();

    if (!settings.filters) {
      return Promise.resolve();
    }

    settings.filters = removeTemplate(settings.filters, templateId);
    return this.save(settings);
  },

  async updateFilterName(filterId: ObjectIdSchema, name: string) {
    const settings = await this.get();

    if (!(settings.filters || []).some(eachFilter => eachFilter.id === filterId)) {
      return Promise.resolve();
    }

    const filter = (settings.filters || []).find(eachFilter => eachFilter.id === filterId);
    if (filter) {
      filter.name = name;
    }

    return this.save(settings);
  },
};
