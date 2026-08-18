import { Settings, SettingsFilterSchema } from '#shared/types/settingsType.js';
import { ensure } from '#shared/tsUtils.js';
import { LanguageSchema, LatLonSchema, ObjectIdSchema } from '#shared/types/commonTypes.js';

import { validateSettings } from '#shared/types/settingsSchema.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import { settingsModel } from './settingsModel.js';
import { persistSettingsAndTranslations } from './settingsTranslations.js';

const DEFAULT_MAP_STARTING_POINT: LatLonSchema[] = [{ lon: 6, lat: 46 }];

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

async function updateTemplatesForNewNameGeneration(currentSettings: Settings) {
  const dao = TemplatesDAOFactory.default();
  const templates = (await dao.get()) as TemplateDBO[];
  const defaultLanguage = currentSettings?.languages?.find(l => l.default)?.key!;

  await ArrayUtils.sequentialFor(templates, async (template: any) => {
    await TemplateFacade.update({ ...template, reindex: false }, defaultLanguage);
  });
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
    const result = await persistSettingsAndTranslations(settings, currentSettings);

    if (!currentSettings.newNameGeneration && settings.newNameGeneration) {
      await updateTemplatesForNewNameGeneration(currentSettings);
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
    const currentSettings = await this.get();

    if (!currentSettings.filters) {
      return Promise.resolve();
    }

    currentSettings.filters = removeTemplate(currentSettings.filters, templateId);
    return this.save(currentSettings);
  },

  async updateFilterName(filterId: ObjectIdSchema, name: string) {
    const currentSettings = await this.get();

    if (!(currentSettings.filters || []).some(eachFilter => eachFilter.id === filterId)) {
      return Promise.resolve();
    }

    const filter = (currentSettings.filters || []).find(eachFilter => eachFilter.id === filterId);
    if (filter) {
      filter.name = name;
    }

    return this.save(currentSettings);
  },

  async getLinks() {
    const currentSettings = await this.get();
    return currentSettings.links || [];
  },

  async saveLinks(links: Settings['links']) {
    const currentSettings = await this.get();
    const newSettings = { ...currentSettings, links };
    return this.save(newSettings);
  },
};
