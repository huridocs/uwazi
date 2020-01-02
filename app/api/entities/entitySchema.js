/** @format */

import Ajv from 'ajv';
import templatesModel from 'api/templates/templatesModel';
import { isUndefined, isNull } from 'util';
import {
  objectIdSchema,
  linkSchema,
  dateRangeSchema,
  geolocationSchema,
  nestedSchema,
  tocSchema,
} from 'api/utils/jsonSchemas';
import { validators, customErrorMessages } from './metadataValidators.js';

const ajv = Ajv({ allErrors: true });

const hasValue = value => !isUndefined(value) && !isNull(value);

const validateMetadataField = (property, entity) => {
  const value = entity.metadata && entity.metadata[property.name];

  if (!validators.validateRequiredProperty(property, value)) {
    throw new Error(customErrorMessages.required);
  }

  if (hasValue(value) && validators[property.type] && !validators[property.type](value)) {
    throw new Error(customErrorMessages[property.type]);
  }
};

ajv.addKeyword('metadataMatchesTemplateProperties', {
  async: true,
  errors: true,
  type: 'object',
  async validate(schema, entity) {
    if (!entity.template) {
      return true;
    }
    const [template] = await templatesModel.get({ _id: entity.template });
    if (!template) {
      throw new Ajv.ValidationError([
        { message: 'template does not exist', dataPath: '.template' },
      ]);
    }

    const errors = template.properties.reduce((err, property) => {
      try {
        validateMetadataField(property, entity);
        return err;
      } catch (e) {
        return [{ message: e.message, dataPath: `.metadata['${property.name}']` }];
      }
    }, []);

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

const schema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  metadataMatchesTemplateProperties: true,
  properties: {
    _id: objectIdSchema,
    sharedId: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    mongoLanguage: { type: 'string' },
    title: { type: 'string', minLength: 1 },
    template: objectIdSchema,
    file: {
      type: 'object',
      properties: {
        originalname: { type: 'string' },
        filename: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'number' },
        timestamp: { type: 'number' },
        language: { type: 'string' },
      },
    },
    fullText: {
      type: 'object',
      patternProperties: {
        '^[0-9]+$': { type: 'string' },
      },
    },
    totalPages: { type: 'number' },
    icon: {
      type: 'object',
      properties: {
        _id: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        label: { type: 'string' },
        type: { type: 'string' },
      },
    },
    attachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalname: { type: 'string' },
          filename: { type: 'string' },
          mimetype: { type: 'string' },
          timestamp: { type: 'number' },
          size: { type: 'number' },
        },
      },
    },
    creationDate: { type: 'number' },
    processed: { type: 'boolean' },
    uploaded: { type: 'boolean' },
    published: { type: 'boolean' },
    pdfInfo: {
      type: 'object',
      patternProperties: {
        '^[0-9]+$': {
          type: 'object',
          properties: {
            chars: { type: 'number' },
          },
        },
      },
    },
    toc: {
      type: 'array',
      items: tocSchema,
    },
    user: objectIdSchema,
    metadata: {
      type: 'object',
      additionalProperties: {
        anyOf: [
          { type: 'null' },
          { type: 'string' },
          { type: 'number' },
          {
            type: 'array',
            items: {
              oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
            },
          },
          nestedSchema,
          dateRangeSchema,
          {
            type: 'array',
            items: dateRangeSchema,
          },
          {
            type: 'array',
            items: dateRangeSchema,
          },
          linkSchema,
          geolocationSchema,
        ],
      },
    },
  },
};

const validateEntity = ajv.compile(schema);

export { validateEntity };
