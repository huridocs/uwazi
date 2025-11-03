import translations from 'api/i18n/translations';

import {
  Settings,
  SettingsLinkSchema,
  SettingsFilterSchema,
  SettingsSublinkSchema,
} from 'shared/types/settingsType';
import { ensure } from 'shared/tsUtils';
import { LanguageSchema, LatLonSchema, ObjectIdSchema } from 'shared/types/commonTypes';

import { validateSettings } from 'shared/types/settingsSchema';
import { ContextType } from 'shared/translationSchema';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import { settingsModel } from './settingsModel';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TemplateDBO } from 'api/core/infrastructure/mongodb/template/DBOs/TemplateDBO';

const DEFAULT_MAP_STARTING_POINT: LatLonSchema[] = [{ lon: 6, lat: 46 }];

type FilterOrLink = SettingsFilterSchema | SettingsLinkSchema | SettingsSublinkSchema;

const isLink = (item: any): item is SettingsLinkSchema => item.type && item.title;

const getUpdatesAndDeletes = <T extends FilterOrLink>(
  matchProperty: keyof T,
  propertyName: keyof T,
  newValues: T[] = [],
  currentValues: T[] = []
) => {
  const updatedValues: { [k: string]: any } = {};
  const deletedValues: string[] = [];
  const values: { [k: string]: string } = {};

  //flatten values
  const flattenedCurrentValues = currentValues.reduce((result, value) => {
    if (isLink(value) && value.sublinks) {
      return [...result, ...(value.sublinks as T[]), value];
    }
    return [...result, value];
  }, [] as T[]);

  const flattenedNewValues = newValues.reduce<T[]>((result, value) => {
    if (isLink(value) && value.sublinks) {
      return [...result, ...(value.sublinks as T[]), value];
    }
    return [...result, value];
  }, [] as T[]);

  flattenedCurrentValues.forEach(value => {
    const matchValue = flattenedNewValues.find(
      (v): v is T =>
        v[matchProperty] && v[matchProperty]?.toString() === value[matchProperty]?.toString()
    );

    if (!matchValue) {
      deletedValues.push(ensure<string>(value[propertyName]));
      return;
    }

    const nameHasChanged = value[propertyName] !== matchValue[propertyName];
    if (nameHasChanged) {
      updatedValues[ensure<string>(value[propertyName])] = matchValue[propertyName];
    }
  });

  //latest values
  flattenedNewValues.forEach(value => {
    values[ensure<string>(value[propertyName])] = ensure<string>(value[propertyName]);
  });

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
      const db = getConnection();
      const templatesCol = db.collection<TemplateDBO>('templates');
      const defaultLanguage = currentSettings?.languages?.find(l => l.default)?.key!;

      await ArrayUtils.sequentialFor(await templatesCol.find().toArray(), async template => {
        await TemplateFacade.update({ ...template, reindex: false }, defaultLanguage);
      });
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
    const keys = new Set(currentSettings.languages.map(l => l.key));
    if (!keys.has(language.key)) currentSettings.languages.push(language);
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

  async getLinks() {
    const settings = await this.get();
    return settings.links || [];
  },

  async saveLinks(links: Settings['links']) {
    const currentSettings = await this.get();
    const newSettings = { ...currentSettings, links };
    return this.save(newSettings);
  },
};
