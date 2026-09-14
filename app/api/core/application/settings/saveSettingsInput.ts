import { z } from 'zod';
import { ISO6391Codes } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { themeVarsSchema } from '#shared/types/themeVars.js';
import { menuItemSchema, objectIdValue, refineMenuItems } from './menuItems.js';

const languageKeySchema = z.custom<LanguageISO6391>(
  (value): value is LanguageISO6391 => typeof value === 'string' && ISO6391Codes.includes(value),
  { message: 'Invalid language key' }
);

const languageSchema = z
  .object({
    _id: objectIdValue.optional(),
    key: languageKeySchema,
    label: z.string(),
    default: z.boolean().optional(),
    rtl: z.boolean().optional(),
    ISO639_3: z.string().optional(),
    elastic: z.string().optional(),
    ISO639_1: languageKeySchema.optional(),
    localized_label: z.string().optional(),
    translationAvailable: z.boolean().optional(),
    installing: z.boolean().optional(),
  })
  .strict();

const filterItemSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
  })
  .strict();

const filterSchema = z
  .object({
    _id: objectIdValue.optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    items: z.array(filterItemSchema).optional(),
  })
  .strict();

const syncTemplateSchema = z
  .object({
    properties: z.array(z.string()),
    filter: z.string().optional(),
    attachments: z.boolean().optional(),
  })
  .strict();

const syncSchema = z
  .object({
    url: z.string(),
    username: z.string(),
    password: z.string(),
    active: z.boolean().optional(),
    name: z.string(),
    config: z
      .object({
        templates: z.record(syncTemplateSchema).optional(),
        relationtypes: z.array(z.string()).optional(),
      })
      .strict(),
  })
  .strict();

const preserveSchema = z
  .object({
    host: z.string(),
    masterToken: z.string(),
    config: z.array(
      z
        .object({
          token: z.string(),
          template: objectIdValue,
          user: objectIdValue.optional(),
        })
        .strict()
    ),
  })
  .strict();

const featuresSchema = z
  .object({
    _id: z.string().optional(),
    tocGeneration: z.object({ url: z.string() }).strict().optional(),
    topicClassification: z.boolean().optional(),
    favorites: z.boolean().optional(),
    preserve: preserveSchema.optional(),
    convertToPdf: z.object({ active: z.boolean(), url: z.string() }).strict().optional(),
    ocr: z.object({ url: z.string() }).strict().optional(),
    segmentation: z.object({ url: z.string() }).strict().optional(),
    twitterIntegration: z
      .object({
        searchQueries: z.array(z.string()),
        hashtagsTemplateName: z.string(),
        tweetsTemplateName: z.string(),
        language: z.string(),
        tweetsLanguages: z.array(z.string()),
      })
      .strict()
      .optional(),
    metadataExtraction: z
      .object({
        url: z.string(),
        templates: z
          .array(
            z
              .object({
                template: objectIdValue,
                properties: z.array(z.string()),
              })
              .strict()
          )
          .optional(),
      })
      .strict()
      .optional(),
    newRelationships: z
      .union([
        z.boolean(),
        z
          .object({
            updateStrategy: z.enum([
              'OnlineRelationshipPropertyUpdateStrategy',
              'QueuedRelationshipPropertyUpdateStrategy',
            ]),
          })
          .strict(),
      ])
      .optional(),
    automaticTranslation: z
      .object({
        active: z.boolean(),
        templates: z
          .array(
            z
              .object({
                template: z.string(),
                commonProperties: z.array(z.string()).optional(),
                properties: z.array(z.string()).optional(),
              })
              .strict()
          )
          .optional(),
      })
      .strict()
      .optional(),
  })
  .passthrough();

const SaveSettingsInputSchema = z
  .object({
    _id: objectIdValue.optional(),
    __v: z.number().optional(),
    project: z.string().optional(),
    site_name: z.string().optional(),
    favicon: z.string().optional(),
    site_logo: z.string().optional(),
    themeAssets: z
      .object({
        preset: z.enum(['default', 'legacy']).optional(),
        siteLogo: z
          .object({
            light: z.string().optional(),
            dark: z.string().optional(),
          })
          .strict()
          .optional(),
        favicon: z
          .object({
            light: z.string().optional(),
            dark: z.string().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    themeVars: themeVarsSchema.optional(),
    contactEmail: z.string().optional(),
    senderEmail: z.string().optional(),
    home_page: z.string().optional(),
    defaultLibraryView: z.string().optional(),
    private: z.boolean().optional(),
    allowcustomJS: z.boolean().optional(),
    openPublicEndpoint: z.boolean().optional(),
    cookiepolicy: z.boolean().optional(),
    mailerConfig: z.string().optional(),
    publicFormDestination: z.string().optional(),
    allowedPublicTemplates: z.array(z.string()).optional(),
    analyticsTrackingId: z.string().optional(),
    matomoConfig: z.string().optional(),
    dateFormat: z.string().optional(),
    custom: z.union([z.string(), z.record(z.unknown())]).optional(),
    customCSS: z.string().optional(),
    customJS: z.string().optional(),
    mapApiKey: z
      .string()
      .regex(/^[a-zA-Z0-9._]*$/)
      .optional(),
    mapLayers: z.array(z.string()).min(1).optional(),
    newNameGeneration: z.literal(true).optional(),
    ocrServiceEnabled: z.boolean().optional(),
    filterUnauthorizedRelated: z.boolean().optional(),
    sync: z.array(syncSchema).optional(),
    languages: z.array(languageSchema).optional(),
    filters: z.array(filterSchema).optional(),
    links: z.array(menuItemSchema).optional(),
    features: featuresSchema.optional(),
    mapStartingPoint: z
      .array(
        z.object({
          label: z.string().optional(),
          lat: z.number(),
          lon: z.number(),
        })
      )
      .optional(),
    tilesProvider: z.string().optional(),
  })
  .strict()
  .superRefine((settings, ctx) => {
    const languages = settings.languages ?? [];
    const defaults = languages.filter(language => language.default === true);
    if (languages.length > 0 && defaults.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one language must be selected as default',
        path: ['languages'],
      });
    }
    if (defaults.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one language must be selected as default',
        path: ['languages'],
      });
    }
    refineMenuItems(settings.links, ctx);
  });

const SaveMenuItemsInputSchema = z
  .object({
    links: z.array(menuItemSchema),
  })
  .strict()
  .superRefine((input, ctx) => refineMenuItems(input.links, ctx));

export { SaveSettingsInputSchema, SaveMenuItemsInputSchema };
