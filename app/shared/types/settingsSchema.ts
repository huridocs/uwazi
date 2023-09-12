import Ajv, { ErrorObject } from 'ajv';
import { wrapValidator } from 'shared/tsUtils';
import { objectIdSchema, languagesListSchema, geolocationSchema } from 'shared/types/commonSchemas';
import { OnlineRelationshipPropertyUpdateStrategy } from 'api/relationships.v2/services/propertyUpdateStrategies/OnlineRelationshipPropertyUpdateStrategy';
import { QueuedRelationshipPropertyUpdateStrategy } from 'api/relationships.v2/services/propertyUpdateStrategies/QueuedRelationshipPropertyUpdateStrategy';
import { Settings } from './settingsType';

const emitSchemaTypes = true;

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

ajv.addKeyword({
  keyword: 'hasDefaultLanguage',
  errors: true,
  type: 'object',
  validate(schema: boolean, settings: Settings) {
    const errors: ErrorObject[] = [];
    const { languages = [] } = settings;
    const defaultLanguage = languages.filter(language => language.default === true);

    if (languages.length > 0 && defaultLanguage.length === 0) {
      errors.push({
        keyword: 'hasDefaultLanguage',
        schemaPath: '',
        params: { keyword: 'hasDefaultLanguage', schema },
        message: 'At least one language must be selected as default',
        instancePath: 'settings.languages',
      });
    }

    if (defaultLanguage.length > 1) {
      errors.push({
        keyword: 'hasDefaultLanguage',
        schemaPath: '',
        params: { keyword: 'hasDefaultLanguage', schema },
        message: 'Only one language must be selected as default',
        instancePath: 'settings.languages',
      });
    }

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

ajv.addKeyword({
  keyword: 'linkTypeLinksShouldHaveUrl',
  errors: true,
  type: 'object',
  validate(schema: boolean, settings: Settings) {
    const errors: ErrorObject[] = [];
    const { links = [] } = settings;

    links.forEach((link, index) => {
      if (link.type === 'link' && !link.url) {
        errors.push({
          keyword: 'linkTypeLinksShouldHaveUrl',
          schemaPath: '',
          params: { keyword: 'linkTypeLinksShouldHaveUrl', schema },
          message: 'Links of type link should have url',
          instancePath: `/links/${index}`,
        });
      }
    });

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

ajv.addKeyword({
  keyword: 'groupTypeLinksShouldNotHaveUrl',
  errors: true,
  type: 'object',
  validate(schema: boolean, settings: Settings) {
    const errors: ErrorObject[] = [];
    const { links = [] } = settings;

    links.forEach((link, index) => {
      if (link.type === 'group' && link.url) {
        errors.push({
          keyword: 'groupTypeLinksShouldNotHaveUrl',
          schemaPath: '',
          params: { keyword: 'groupTypeLinksShouldNotHaveUrl', schema },
          message: 'Links of type group should not have url',
          instancePath: `/links/${index}`,
        });
      }
    });

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

ajv.addKeyword({
  keyword: 'linkTypeLinksShouldNotHaveSublinks',
  errors: true,
  type: 'object',
  validate(schema: boolean, settings: Settings) {
    const errors: ErrorObject[] = [];
    const { links = [] } = settings;

    links.forEach((link, index) => {
      if (link.type === 'link' && link.sublinks?.length) {
        errors.push({
          keyword: 'linkTypeLinksShouldNotHaveSublinks',
          schemaPath: '',
          params: { keyword: 'linkTypeLinksShouldNotHaveSublinks', schema },
          message: 'Links of type link should not have sublinks',
          instancePath: `/links/${index}`,
        });
      }
    });

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

ajv.addKeyword({
  keyword: 'groupTypeLinksShouldHaveSublinks',
  errors: true,
  type: 'object',
  validate(schema: boolean, settings: Settings) {
    const errors: ErrorObject[] = [];
    const { links = [] } = settings;

    links.forEach((link, index) => {
      if (link.type === 'group' && !link.sublinks?.length) {
        errors.push({
          keyword: 'groupTypeLinksShouldHaveSublinks',
          schemaPath: '',
          params: { keyword: 'groupTypeLinksShouldHaveSublinks', schema },
          message: 'Links of type group should have sublinks',
          instancePath: `/links/${index}`,
        });
      }
    });

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

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
    properties: { type: 'array', items: { type: 'string' } },
    filter: { type: 'string' },
    attachments: { type: 'boolean' },
  },
  additionalProperties: false,
};

const settingsSyncRelationtypesSchema = {
  type: 'array',
  items: { type: 'string' },
};

const settingsSyncSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['url', 'username', 'password', 'name', 'config'],
  properties: {
    url: { type: 'string' },
    active: { type: 'boolean' },
    username: { type: 'string' },
    password: { type: 'string' },
    name: { type: 'string' },
    config: {
      type: 'object',
      properties: {
        templates: {
          type: 'object',
          additionalProperties: settingsSyncTemplateSchema,
        },
        relationtypes: settingsSyncRelationtypesSchema,
      },
      additionalProperties: false,
    },
  },
};

const settingsPreserveConfigSchema = {
  title: 'PreserveConfig',
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  required: ['host', 'config', 'masterToken'],
  properties: {
    host: { type: 'string' },
    masterToken: { type: 'string' },
    config: {
      type: 'array',
      items: {
        required: ['token', 'template'],
        type: 'object',
        additionalProperties: false,
        properties: { token: { type: 'string' }, template: objectIdSchema, user: objectIdSchema },
      },
    },
  },
};

const settingsSublinkSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    url: { type: 'string' },
    localId: { type: 'string' },
  },
  required: ['title', 'url'],
};

const settingsLinkSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema, settingsSublinkSchema },
  properties: {
    _id: objectIdSchema,
    title: { type: 'string' },
    url: { type: 'string' },
    sublinks: {
      type: 'array',
      items: settingsSublinkSchema,
    },
    type: { type: 'string', enum: ['link', 'group'] },
  },
  required: ['title', 'type'],
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
    settingsPreserveConfigSchema,
  },
  additionalProperties: false,
  hasDefaultLanguage: true,
  linkTypeLinksShouldHaveUrl: true,
  groupTypeLinksShouldNotHaveUrl: true,
  linkTypeLinksShouldNotHaveSublinks: true,
  groupTypeLinksShouldHaveSublinks: true,
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
    allowcustomJS: { type: 'boolean' },
    openPublicEndpoint: { type: 'boolean' },
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
    customJS: { type: 'string' },
    mapApiKey: { type: 'string', pattern: '^[a-zA-Z0-9._]*$' },
    newNameGeneration: { type: 'boolean', enum: [true] },
    ocrServiceEnabled: { type: 'boolean' },

    sync: { type: 'array', items: settingsSyncSchema },

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
        preserve: settingsPreserveConfigSchema,
        convertToPdf: {
          type: 'object',
          additionalProperties: false,
          required: ['url', 'active'],
          properties: {
            active: { type: 'boolean' },
            url: { type: 'string' },
          },
        },
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
        twitterIntegration: {
          type: 'object',
          additionalProperties: false,
          required: [
            'searchQueries',
            'hashtagsTemplateName',
            'tweetsTemplateName',
            'language',
            'tweetsLanguages',
          ],
          properties: {
            searchQueries: { type: 'array', items: { type: 'string' } },
            hashtagsTemplateName: { type: 'string' },
            tweetsTemplateName: { type: 'string' },
            language: { type: 'string' },
            tweetsLanguages: { type: 'array', items: { type: 'string' } },
          },
        },
        metadataExtraction: {
          type: 'object',
          additionalProperties: false,
          required: ['url'],
          properties: {
            url: { type: 'string' },
            templates: {
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
        newRelationships: {
          oneOf: [
            { type: 'boolean' },
            {
              type: 'object',
              additionalProperties: false,
              required: ['updateStrategy'],
              properties: {
                updateStrategy: {
                  type: 'string',
                  enum: [
                    OnlineRelationshipPropertyUpdateStrategy.name,
                    QueuedRelationshipPropertyUpdateStrategy.name,
                  ],
                },
              },
            },
          ],
        },
      },
    },
    mapStartingPoint: geolocationSchema,
    tilesProvider: { type: 'string' },
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
  settingsSublinkSchema,
  settingsLinkSchema,
  settingsSchema,
  settingsPreserveConfigSchema,
};
