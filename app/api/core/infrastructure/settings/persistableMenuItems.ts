import { Settings, SettingsLinkSchema } from '#shared/types/settingsType.js';

type MenuItemIdentity = {
  id?: string;
  _id?: unknown;
};

const omitNestedId = <T extends object>(item: T): Omit<T, '_id'> => {
  const { _id: _nestedId, ...rest } = item as T & { _id?: unknown };
  return rest;
};

const asMenuItemId = (item: MenuItemIdentity): string | undefined => {
  if (item.id) {
    return item.id;
  }
  if (item._id == null || item._id === '') {
    return undefined;
  }
  return String(item._id);
};

const withReadableId = <T extends MenuItemIdentity>(item: T): Omit<T, '_id'> => {
  const withoutId = omitNestedId(item);
  const id = asMenuItemId(item);
  return id ? { ...withoutId, id } : withoutId;
};

const withPersistedId = <T extends MenuItemIdentity>(
  item: T,
  generateId: () => string
): Omit<T, '_id'> & { id: string } => ({
  ...omitNestedId(item),
  id: asMenuItemId(item) ?? generateId(),
});

const toReadableMenuItems = (
  links: SettingsLinkSchema[] | undefined
): SettingsLinkSchema[] | undefined => {
  if (!links) {
    return links;
  }

  return links.map(link => {
    const readable = withReadableId(link);
    if (!link.sublinks) {
      return readable;
    }
    return {
      ...readable,
      sublinks: link.sublinks.map(sublink => withReadableId(sublink)),
    };
  });
};

const toPersistableMenuItems = (
  links: NonNullable<Settings['links']>,
  generateId: () => string
): NonNullable<Settings['links']> =>
  links.map(link => {
    const persisted = withPersistedId(link, generateId);
    if (!link.sublinks) {
      return persisted;
    }
    return {
      ...persisted,
      sublinks: link.sublinks.map(sublink => withPersistedId(sublink, generateId)),
    };
  });

export { toPersistableMenuItems, toReadableMenuItems };
