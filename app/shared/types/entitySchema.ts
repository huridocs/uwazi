/* eslint-disable max-statements */
import Ajv from 'ajv';
import templatesModel from 'api/templates/templatesModel';
import { isUndefined, isNull } from 'util';
import { objectIdSchema, metadataSchema } from 'shared/types/commonSchemas';
import { wrapValidator, ensure } from 'shared/tsUtils';
import { validators, customErrorMessages } from 'api/entities/metadataValidators.js';
import { EntitySchema } from './entityType';
import { PropertySchema } from './commonTypes';
import { TemplateSchema } from './templateType';

import { propertyTypes } from 'shared/propertyTypes';
import entities from 'api/entities';

export const emitSchemaTypes = true;

const ajv = Ajv({ allErrors: true });

const hasValue = (value: any) => !isUndefined(value) && !isNull(value);

const validateMetadataField = async (property: PropertySchema, entity: EntitySchema) => {
  const value = entity.metadata && entity.metadata[ensure<string>(property.name)];

  if (!validators.validateRequiredProperty(property, value)) {
    throw new Error(customErrorMessages.required);
  }

  //@ts-ignore
  if (hasValue(value) && validators[property.type] && !validators[property.type](value)) {
    //@ts-ignore
    throw new Error(customErrorMessages[property.type]);
  }

  if (value && property.type === propertyTypes.relationship) {
    const valueIds = value.map(v => v.value);

    const entityIds = (
      await entities.get(
        {
          sharedId: { $in: valueIds },
          ...(property.content && { template: property.content }),
        },
        { sharedId: 1 }
      )
    ).map(v => v.sharedId);

    const diff = value.filter(v => !entityIds.includes(String(v.value)));

    //@ts-ignore
    if (diff.length) {
      throw new Ajv.ValidationError([
        {
          keyword: 'metadataMatchesTemplateProperties',
          schemaPath: '',
          params: {},
          message: customErrorMessages.relationship_nonexistent_ids,
          dataPath: `.metadata['${property.name}']`,
          data: diff,
        },
      ]);
    }
  }

  if (hasValue(value) && !validators.validateLuceneBytesLimit(value)) {
    throw new Error(customErrorMessages.length_exceeded);
  }
};

ajv.addKeyword('metadataMatchesTemplateProperties', {
  async: true,
  errors: true,
  type: 'object',
  async validate(fields: any, entity: EntitySchema) {
    if (!entity.template) {
      return true;
    }

    const [template = {} as TemplateSchema] = await templatesModel.get({ _id: entity.template });
    const errors: Ajv.ErrorObject[] = await (template.properties || []).reduce<
      Promise<Ajv.ErrorObject[]>
    >(async (err: Promise<Ajv.ErrorObject[]>, property) => {
      try {
        await validateMetadataField(property, entity);
        return err;
      } catch (e) {
        const currentErrors = await err;
        if (e instanceof Ajv.ValidationError) {
          return currentErrors.concat(e.errors);
        }
        currentErrors.push({
          keyword: 'metadataMatchesTemplateProperties',
          schemaPath: '',
          params: { keyword: 'metadataMatchesTemplateProperties', fields },
          message: e.message,
          dataPath: `.metadata['${property.name}']`,
        });
        return currentErrors;
      }
    }, Promise.resolve([]));

    const allowedProperties = (template.properties || []).map(p => p.name);
    Object.keys(entity.metadata || {}).forEach((propName: string) => {
      if (!allowedProperties.includes(propName)) {
        errors.push({
          keyword: 'metadataMatchesTemplateProperties',
          schemaPath: '',
          params: { keyword: 'metadataMatchesTemplateProperties', fields },
          message: customErrorMessages.property_not_allowed,
          dataPath: `.metadata['${propName}']`,
        });
      }
    });

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

ajv.addKeyword('validateTemplateExists', {
  async: true,
  errors: true,
  type: 'object',
  async validate(fields: any, entity: EntitySchema) {
    if (!entity.template) {
      return true;
    }
    const [template] = await templatesModel.get({ _id: entity.template });
    if (!template) {
      throw new Ajv.ValidationError([
        {
          keyword: 'metadataMatchesTemplateProperties',
          schemaPath: '',
          params: { keyword: 'metadataMatchesTemplateProperties', fields },
          message: 'template does not exist',
          dataPath: '.template',
        },
      ]);
    }
    return true;
  },
});

ajv.addKeyword('stringMeetsLuceneMaxLimit', {
  errors: false,
  type: 'string',
  validate(_schema: any, data: EntitySchema) {
    return validators.validateLuceneBytesLimit(data);
  },
});

export const entitySchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  metadataMatchesTemplateProperties: true,
  validateTemplateExists: true,
  definitions: {
    objectIdSchema,
    metadataSchema,
  },
  properties: {
    _id: objectIdSchema,
    sharedId: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    mongoLanguage: { type: 'string' },
    title: { type: 'string', minLength: 1, stringMeetsLuceneMaxLimit: true },
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
