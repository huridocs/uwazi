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

const getUpdatesAndDeletes = <T extends FilterOrLink>({
  matchProperty,
  propertyName,
  newValues = [],
  currentValues = [],
}: {
  matchProperty: keyof T;
  propertyName: keyof T;
  newValues?: T[];
  currentValues?: T[];
}) => {
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

class SettingsTranslationService {
  constructor(private translationsService: TranslationsService) {}

  async reconcile(incoming: Settings, current: Settings) {
    await this.reconcileLinks(incoming.links, current.links);
    await this.reconcileFilters(incoming.filters, current.filters);
  }

  async reconcileLinks(newLinks: Settings['links'], currentLinks: Settings['links'] = []) {
    if (!newLinks) {
      return;
    }

    const { updatedValues, deletedValues, values } = getUpdatesAndDeletes({
      matchProperty: 'id',
      propertyName: 'title',
      newValues: toReadableMenuItems(newLinks) ?? [],
      currentValues: toReadableMenuItems(currentLinks) ?? [],
    });

    await this.translationsService.updateContext({
      context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
      keyChanges: updatedValues,
      keysToDelete: deletedValues,
      valueChanges: values,
    });
  }

  async reconcileFilters(
    newFiltersInput: Settings['filters'],
    currentFiltersInput: Settings['filters'] = []
  ) {
    if (!newFiltersInput) {
      return;
    }

    const newFilters = newFiltersInput.filter(item => item.items);
    const currentFilters = currentFiltersInput.filter(item => item.items);

    const { updatedValues, deletedValues, values } = getUpdatesAndDeletes({
      matchProperty: 'id',
      propertyName: 'name',
      newValues: newFilters,
      currentValues: currentFilters,
    });

    await this.translationsService.updateContext({
      context: { id: 'Filters', label: 'Filters', type: 'Uwazi UI' },
      keyChanges: updatedValues,
      keysToDelete: deletedValues,
      valueChanges: values,
    });
  }
}

export { SettingsTranslationService };
