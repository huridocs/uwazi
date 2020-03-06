/** @format */

import Ajv from 'ajv';
import templatesModel from 'api/templates/templatesModel';
import { isUndefined, isNull } from 'util';
import { objectIdSchema, metadataSchema } from 'shared/types/commonSchemas';
import { wrapValidator } from 'shared/tsUtils';
import { validators, customErrorMessages } from 'api/entities/metadataValidators.js';

export const emitSchemaTypes = true;

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
  async validate(_schema, entity) {
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

export const entitySchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  metadataMatchesTemplateProperties: true,
  definitions: {
    objectIdSchema,
    metadataSchema,
  },
  properties: {
    _id: objectIdSchema,
    sharedId: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    mongoLanguage: { type: 'string' },
    title: { type: 'string', minLength: 1 },
    template: objectIdSchema,
    published: { type: 'boolean' },
    icon: {
      type: 'object',
      additionalProperties: false,
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
    user: objectIdSchema,
    metadata: metadataSchema,
    suggestedMetadata: metadataSchema,
  },
};

export const validateEntity = wrapValidator(ajv.compile(entitySchema));
