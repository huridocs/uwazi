import {
  SettingsFilterSchema,
  SettingsLinkSchema,
  SettingsSublinkSchema,
} from '#shared/types/settingsType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';

type MenuIdentity = { id?: string; _id?: unknown };

const omitNestedId = <T extends object>(item: T): Omit<T, '_id'> => {
  const { _id: _nestedId, ...rest } = item as T & { _id?: unknown };
  return rest;
};

const asMenuItemId = (item: MenuIdentity): string | undefined => {
  if (item.id) {
    return item.id;
  }
  if (item._id == null || item._id === '') {
    return undefined;
  }
  return String(item._id);
};

const withMenuId = <T extends MenuIdentity>(
  item: T,
  generateId: () => string
): Omit<T, '_id'> & { id: string } => ({
  ...omitNestedId(item),
  id: asMenuItemId(item) ?? generateId(),
});

const assignMenuIds = (
  links: SettingsLinkSchema[],
  generateId: () => string
): SettingsLinkSchema[] =>
  links.map(link => {
    const persisted = withMenuId(link, generateId);
    if (!link.sublinks) {
      return persisted;
    }
    return {
      ...persisted,
      sublinks: link.sublinks.map((sublink: SettingsSublinkSchema) =>
        withMenuId(sublink, generateId)
      ),
    };
  });

const renameFilterTree = (
  filters: SettingsFilterSchema[],
  filterId: ObjectIdSchema,
  name: string
): SettingsFilterSchema[] | undefined => {
  if (!filters.some(filter => filter.id === filterId)) {
    return undefined;
  }
  return filters.map(filter => (filter.id === filterId ? { ...filter, name } : filter));
};

const removeTemplateFromFilterTree = (
  filters: SettingsFilterSchema[],
  templateId: ObjectIdSchema
): SettingsFilterSchema[] =>
  filters
    .filter(filter => filter.id !== templateId)
    .map(filter =>
      filter.items
        ? { ...filter, items: removeTemplateFromFilterTree(filter.items, templateId) }
        : filter
    );

export { assignMenuIds, renameFilterTree, removeTemplateFromFilterTree };
