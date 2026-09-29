import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { SettingsLinkSchema, SettingsSublinkSchema } from '#shared/types/settingsType.js';

const objectIdValue = z.union([z.string(), z.instanceof(ObjectId)]);

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

export { menuItemSchema, objectIdValue, refineMenuItems };
export type { SettingsLinkSchema as MenuItem };
