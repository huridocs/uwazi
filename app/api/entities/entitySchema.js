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
} from 'shared/commonSchemas';
import { propertyTypes } from 'shared/propertyTypes';
import { wrapValidator } from 'shared/tsUtils';

export const emitSchemaTypes = true;

const ajv = Ajv({ allErrors: true });

const isEmpty = value => isNull(value) || isUndefined(value) || !value.length;

const isNonArrayObject = value => isObject(value) && !Array.isArray(value);

const isValidDateRange = value => {
  if (!isNonArrayObject(value)) {
    return false;
  }
  if (isNumber(value.from) && isNumber(value.to)) {
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

const validateTextProperty = (property, value) => {
  const textProperties = [
    propertyTypes.text,
    propertyTypes.markdown,
    propertyTypes.media,
    propertyTypes.image,
    propertyTypes.select,
  ];
  if (textProperties.includes(property.type)) {
    return isString(value);
  }
  return true;
};

const validateNumericProperty = (property, value) => {
  if (property.type === propertyTypes.numeric) {
    return isNumber(value) || value === '';
  }
  return true;
};

const validateDateProperty = (property, value) => {
  if (property.type === propertyTypes.date) {
    return isNumber(value) && value >= 0;
  }
  return true;
};

const validateMultiDateProperty = (property, value) => {
  if (property.type === propertyTypes.multidate) {
    return Array.isArray(value) && value.every(item => isNumber(item) || isNull(item));
  }
  return true;
};

const validateDateRangeProperty = (property, value) => {
  if (property.type === propertyTypes.daterange) {
    return isValidDateRange(value);
  }
  return true;
};

const validateMultiDateRangeProperty = (property, value) => {
  if (property.type === propertyTypes.multidaterange) {
    return value.every(isValidDateRange);
  }
  return true;
};

const validateGeolocationProperty = (property, value) => {
  if (property.type === propertyTypes.geolocation) {
    return Array.isArray(value) && value.every(isValidGeolocation);
  }
  return true;
};

const validateMultiSelectProperty = (property, value) => {
  if ([propertyTypes.multiselect, propertyTypes.relationship].includes(property.type)) {
    return Array.isArray(value) && value.every(isValidSelect);
  }
  return true;
};

const validateLinkProperty = (property, value) => {
  if (property.type === propertyTypes.link) {
    return isString(value.label) && value.label && isString(value.url) && value.url;
  }
  return true;
};

const validateMetadataField = (property, entity) => {
  const value = entity.metadata && entity.metadata[property.name];
  if (!validateRequiredProperty(property, value)) {
    return false;
  }
  if (isUndefined(value) || isNull(value)) {
    return true;
  }
  const propertyValidators = [
    validateDateProperty,
    validateMultiDateProperty,
    validateDateRangeProperty,
    validateMultiDateRangeProperty,
    validateTextProperty,
    validateNumericProperty,
    validateMultiSelectProperty,
    validateLinkProperty,
    validateGeolocationProperty,
  ];
  return propertyValidators.every(validate => validate(property, value));
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

export const entitySchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  metadataMatchesTemplateProperties: true,
  definitions: {
    objectIdSchema,
    linkSchema,
    dateRangeSchema,
    geolocationSchema,
    tocSchema,
  },
  properties: {
    _id: objectIdSchema,
    sharedId: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    mongoLanguage: { type: 'string' },
    title: { type: 'string', minLength: 1 },
    template: objectIdSchema,
    file: {
      type: 'object',
      additionalProperties: false,
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
      additionalProperties: false,
      patternProperties: {
        '^[0-9]+$': { type: 'string' },
      },
    },
    totalPages: { type: 'number' },
    icon: {
      type: 'object',
      additionalProperties: false,
      properties: {
        _id: { type: 'string' },
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
      additionalProperties: false,
      patternProperties: {
        '^[0-9]+$': {
          type: 'object',
          additionalProperties: false,
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
          {
            type: 'array',
            items: {
              oneOf: [
                { type: 'number' },
                { type: 'null' }
              ],
            }
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

export const validateEntity = wrapValidator(ajv.compile(entitySchema));
