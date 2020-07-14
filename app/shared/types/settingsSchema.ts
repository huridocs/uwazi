import Ajv from 'ajv';
import { wrapValidator } from 'shared/tsUtils';
import { objectIdSchema, languagesListSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

const ajv = Ajv({ allErrors: true });

export const settingsFilterSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    id: { type: 'string' },
    name: { type: 'string' },
    items: {},
  },
};

export const settingsSyncSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    url: { type: 'string' },
    active: { type: 'boolean' },
    username: { type: 'boolean' },
    password: { type: 'boolean' },
    config: {},
  },
};

export const settingsLinkSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    //WTF ?
    localID: { type: 'string' },
    //
    title: { type: 'string' },
    url: { type: 'string' },
  },
};

export const settingsSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  title: 'Settings',
  definitions: {
    objectIdSchema,
    languagesListSchema,
    settingsFilterSchema,
    settingsLinkSchema,
    settingsSyncSchema,
  },
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    __v: { type: 'number' },
    project: { type: 'string' },
    site_name: { type: 'string' },
    contactEmail: { type: 'string' },
    home_page: { type: 'string' },
    private: { type: 'boolean' },
    cookiepolicy: { type: 'boolean' },
    mailerConfig: { type: 'string' },
    publicFormDestination: { type: 'string' },
    allowedPublicTemplates: {
      type: 'array',
      items: { type: 'string' },
    },
    analyticsTrackingId: { type: 'string' },
    matomoConfig: { type: 'string' },
    dateFormat: { type: 'string' },
    custom: {},
    customCSS: { type: 'string' },
    mapTilerKey: { type: 'string' },
    newNameGeneration: { type: 'boolean', enum: [true] },

    sync: settingsSyncSchema,

    languages: languagesListSchema,

    filters: {
      type: 'array',
      items: settingsFilterSchema,
    },

    links: {
      type: 'array',
      items: settingsLinkSchema,
    },

    features: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        semanticSearch: { type: 'boolean' },
        topicClassification: { type: 'boolean' },
        favorites: { type: 'boolean' },
      },
    },
  },
};

const validateSettings = wrapValidator(ajv.compile(settingsSchema));
export { validateSettings };
