import Ajv from 'ajv';
import { wrapValidator } from 'shared/tsUtils';
import { objectIdSchema, languagesListSchema, geolocationSchema } from 'shared/types/commonSchemas';

const emitSchemaTypes = true;

const ajv = Ajv({ allErrors: true });

const itemSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
  },
};

const settingsFilterSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    id: { type: 'string' },
    name: { type: 'string' },
    items: { type: 'array', items: itemSchema },
  },
};

const settingsSyncTemplateSchema = {
  type: 'object',
  required: ['properties'],
  properties: {
    properties: { items: { type: 'string' } },
    filter: { type: 'string' },
  },
  additionalProperties: false,
};

const settingsSyncRelationtypesSchema = {
  items: { type: 'string' },
};

const settingsSyncSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    url: { type: 'string' },
    active: { type: 'boolean' },
    username: { type: 'boolean' },
    password: { type: 'boolean' },
    config: {
      type: 'object',
      properties: {
        templates: {
          type: 'object',
          additionalProperties: {
            anyOf: [settingsSyncTemplateSchema, { type: 'array', items: { type: 'string' } }],
          },
        },
        relationTypes: settingsSyncRelationtypesSchema,
      },
      additionalProperties: false,
    },
  },
};

const settingsLinkSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    title: { type: 'string' },
    url: { type: 'string' },
    sublinks: {
      type: 'array',
      items: { type: 'object', properties: { title: { type: 'string' } } },
    },
    type: { type: 'string' },
  },
};

const settingsSchema = {
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
    favicon: { type: 'string' },
    contactEmail: { type: 'string' },
    senderEmail: { type: 'string' },
    home_page: { type: 'string' },
    defaultLibraryView: { type: 'string' },
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
    custom: { oneOf: [{ type: 'string' }, { type: 'object' }] },
    customCSS: { type: 'string' },
    mapTilerKey: { type: 'string' },
    newNameGeneration: { type: 'boolean', enum: [true] },
    toggleOCRButton: { type: 'boolean' },

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
        tocGeneration: {
          type: 'object',
          required: ['url'],
          additionalProperties: false,
          properties: {
            url: { type: 'string' },
          },
        },
        topicClassification: { type: 'boolean' },
        favorites: { type: 'boolean' },
        ocr: {
          type: 'object',
          additionalProperties: false,
          required: ['url'],
          properties: {
            url: { type: 'string' },
          },
        },
        segmentation: {
          type: 'object',
          additionalProperties: false,
          required: ['url'],
          properties: {
            url: { type: 'string' },
          },
        },
        metadataExtraction: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['template', 'properties'],
            properties: {
              template: objectIdSchema,
              properties: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    mapStartingPoint: geolocationSchema,
    toggleOCRButton: { type: 'boolean' },
  },
};

const validateSettings = wrapValidator(ajv.compile(settingsSchema));
export {
  validateSettings,
  emitSchemaTypes,
  itemSchema,
  settingsFilterSchema,
  settingsSyncTemplateSchema,
  settingsSyncRelationtypesSchema,
  settingsSyncSchema,
  settingsLinkSchema,
  settingsSchema,
};
