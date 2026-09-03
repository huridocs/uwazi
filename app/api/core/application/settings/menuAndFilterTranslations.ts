import {
  Settings,
  SettingsFilterSchema,
  SettingsLinkSchema,
  SettingsSublinkSchema,
} from '#shared/types/settingsType.js';
import { ensure } from '#shared/tsUtils.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { toReadableMenuItems } from '#api/core/infrastructure/settings/persistableMenuItems.js';

type FilterOrLink = SettingsFilterSchema | SettingsLinkSchema | SettingsSublinkSchema;

const isLink = (item: FilterOrLink): item is SettingsLinkSchema =>
  'type' in item && Boolean((item as SettingsLinkSchema).type) && 'title' in item;

// oxlint-disable-next-line max-params
const getUpdatesAndDeletes = <T extends FilterOrLink>(
  matchProperty: keyof T,
  propertyName: keyof T,
  newValues: T[] = [],
  currentValues: T[] = []
) => {
  const updatedValues: { [k: string]: string } = {};
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
  }, []);

  flattenedCurrentValues.forEach(value => {
    const matchValue = flattenedNewValues.find(
      (v): v is T =>
        Boolean(v[matchProperty]) &&
        v[matchProperty]?.toString() === value[matchProperty]?.toString()
    );

    if (!matchValue) {
      deletedValues.push(ensure<string>(value[propertyName] as string));
      return;
    }

    const nameHasChanged = value[propertyName] !== matchValue[propertyName];
    if (nameHasChanged) {
      updatedValues[ensure<string>(value[propertyName] as string)] = matchValue[
        propertyName
      ] as string;
    }
  });

  flattenedNewValues.forEach(value => {
    values[ensure<string>(value[propertyName] as string)] = ensure<string>(
      value[propertyName] as string
    );
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
    'id',
    'title',
    toReadableMenuItems(newLinks) ?? [],
    toReadableMenuItems(currentLinks) ?? []
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

const persistMenuAndFilterTranslations = async (
  translationsService: TranslationsService,
  incoming: Settings,
  current: Settings
) => {
  await saveLinksTranslations(translationsService, incoming.links, current.links);
  await saveFiltersTranslations(translationsService, incoming.filters, current.filters);
};

export { persistMenuAndFilterTranslations };
