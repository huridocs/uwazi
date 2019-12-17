/** @format */

import Ajv from 'ajv';
import templatesModel from 'api/templates/templatesModel';
import { isNumber, isUndefined, isString, isObject, isNull } from 'util';
import {
  objectIdSchema,
  linkSchema,
  dateRangeSchema,
  geolocationSchema,
  tocSchema,
} from 'api/utils/jsonSchemas';
import { templateTypes } from 'shared/templateTypes';

const ajv = Ajv({ allErrors: true });

const isEmpty = value => isNull(value) || isUndefined(value) || !value.length;

const isNonArrayObject = value => isObject(value) && !Array.isArray(value);

const validateDateProperty = value => isNumber(value);

const isValidDateRange = value => {
  if (!isNonArrayObject(value)) {
    return false;
  }
  if (validateDateProperty(value.from) && validateDateProperty(value.to)) {
    return value.from <= value.to;
  }
  return true;
};

const isValidSelect = value => isString(value) && value;

const isValidGeolocation = value =>
  isString(value.label) && isNumber(value.lat) && isNumber(value.lon);

const validateRequiredProperty = (property, value) => {
  if (property.required) {
    return !isEmpty(value);
  }
  return true;
};

const validateTextProperty = value => isString(value);

const validateNumericProperty = value => isNumber(value) || value === '';

const validateMultiDateProperty = value =>
  Array.isArray(value) && value.every(item => validateDateProperty(item) || isNull(item));

const validateDateRangeProperty = value => isValidDateRange(value);

const validateMultiDateRangeProperty = value => value.every(isValidDateRange);

const validateGeolocationProperty = value =>
  Array.isArray(value) && value.every(isValidGeolocation);

const validateMultiSelectProperty = value => Array.isArray(value) && value.every(isValidSelect);

const validateLinkProperty = value =>
  isString(value.label) && value.label && isString(value.url) && value.url;

const validators = {
  [templateTypes.date]: validateDateProperty,
  [templateTypes.multidate]: validateMultiDateProperty,
  [templateTypes.daterange]: validateDateRangeProperty,
  [templateTypes.multidaterange]: validateMultiDateRangeProperty,
  [templateTypes.text]: validateTextProperty,
  [templateTypes.markdown]: validateTextProperty,
  [templateTypes.media]: validateTextProperty,
  [templateTypes.image]: validateTextProperty,
  [templateTypes.select]: validateTextProperty,
  [templateTypes.multiselect]: validateMultiSelectProperty,
  [templateTypes.relationship]: validateMultiSelectProperty,
  [templateTypes.numeric]: validateNumericProperty,
  [templateTypes.link]: validateLinkProperty,
  [templateTypes.geolocation]: validateGeolocationProperty,
};

const validateMetadataField = (property, entity) => {
  const value = entity.metadata && entity.metadata[property.name];
  if (!validateRequiredProperty(property, value)) {
    return false;
  }
  if (isUndefined(value) || isNull(value)) {
    return true;
  }

  return validators[property.type] ? validators[property.type](value) : true;
};

ajv.addKeyword('metadataMatchesTemplateProperties', {
  async: true,
  errors: false,
  type: 'object',
  async validate(schema, entity) {
    if (!entity.template) {
      return true;
    }
    const [template] = await templatesModel.get({ _id: entity.template });
    if (!template) {
      return false;
    }

    return template.properties.every(property => validateMetadataField(property, entity));
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
              type: 'string',
            },
          },
          {
            type: 'array',
            items: {
              type: 'number',
            },
          },
          {
            type: 'array',
            items: {
              oneOf: [{ type: 'number' }, { type: 'null' }],
            },
          },
          dateRangeSchema,
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
