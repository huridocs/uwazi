import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { Settings, SettingsLinkSchema, SettingsSublinkSchema } from '#shared/types/settingsType.js';

const objectIdValue = z.union([z.string(), z.instanceof(ObjectId)]);

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

const menuSublinkSchema: z.ZodType<SettingsSublinkSchema> = z
  .object({
    _id: objectIdValue.optional(),
    id: z.string().optional(),
    title: z.string(),
    type: z.literal('link'),
    url: z.string(),
    localId: z.string().optional(),
  })
  .strict();

const menuItemSchema: z.ZodType<SettingsLinkSchema> = z
  .object({
    _id: objectIdValue.optional(),
    id: z.string().optional(),
    title: z.string(),
    url: z.string().optional(),
    localId: z.string().optional(),
    sublinks: z.array(menuSublinkSchema).optional(),
    type: z.enum(['link', 'group']),
  })
  .strict();

const refineMenuItems = (
  links: SettingsLinkSchema[] | undefined,
  ctx: z.RefinementCtx,
  path: (string | number)[] = ['links']
) => {
  (links ?? []).forEach((link, index) => {
    const itemPath = [...path, index];
    if (link.type === 'link' && !link.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Links of type link should have url',
        path: itemPath,
      });
    }
    if (link.type === 'group' && link.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Links of type group should not have url',
        path: itemPath,
      });
    }
    if (link.type === 'link' && link.sublinks?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Links of type link should not have sublinks',
        path: itemPath,
      });
    }
    if (link.type === 'group' && !link.sublinks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Links of type group should have sublinks',
        path: itemPath,
      });
    }
  });
};

export {
  menuItemSchema,
  objectIdValue,
  refineMenuItems,
  toPersistableMenuItems,
  toReadableMenuItems,
};
export type { SettingsLinkSchema as MenuItem };
