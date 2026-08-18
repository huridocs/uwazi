import {
  Settings,
  SettingsFilterSchema,
  SettingsLinkSchema,
  SettingsSublinkSchema,
} from '#shared/types/settingsType.js';
import { ensure } from '#shared/tsUtils.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import { settingsModel } from './settingsModel.js';

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

  flattenedNewValues.forEach(value => {
    values[ensure<string>(value[propertyName])] = ensure<string>(value[propertyName]);
  });

  return { updatedValues, deletedValues, values };
};

const saveLinksTranslations = async (
  translationsService: TranslationsService,
  newLinks: Settings['links'],
  currentLinks: Settings['links'] = []
) => {
  if (!newLinks) {
    return;
  }

  const { updatedValues, deletedValues, values } = getUpdatesAndDeletes(
    '_id',
    'title',
    newLinks,
    currentLinks
  );

  await translationsService.updateContext({
    context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
    keyChanges: updatedValues,
    keysToDelete: deletedValues,
    valueChanges: values,
  });
};

const saveFiltersTranslations = async (
  translationsService: TranslationsService,
  newFiltersInput: Settings['filters'],
  currentFiltersInput: Settings['filters'] = []
) => {
  if (!newFiltersInput) {
    return;
  }

  const newFilters = newFiltersInput.filter(item => item.items);
  const currentFilters = currentFiltersInput.filter(item => item.items);

  const { updatedValues, deletedValues, values } = getUpdatesAndDeletes(
    'id',
    'name',
    newFilters,
    currentFilters
  );

  await translationsService.updateContext({
    context: { id: 'Filters', label: 'Filters', type: 'Uwazi UI' },
    keyChanges: updatedValues,
    keysToDelete: deletedValues,
    valueChanges: values,
  });
};

export async function persistSettingsAndTranslations(
  settings: Settings,
  currentSettings: Settings
) {
  const transactionManager = TransactionManagerFactory.default();
  const translationsService = TranslationsServiceFactory.default({ transactionManager });

  return transactionManager.run(async () => {
    dbSessionContext.setTransactionManager(transactionManager);
    try {
      await saveLinksTranslations(translationsService, settings.links, currentSettings.links);
      await saveFiltersTranslations(translationsService, settings.filters, currentSettings.filters);
      return settingsModel.save({ ...settings, _id: currentSettings._id });
    } finally {
      dbSessionContext.clearSession();
    }
  });
}
