import Ajv from 'ajv';
import templatesModel from 'api/templates/templatesModel';
import { templateTypes } from 'shared/templateTypes';
import { isNumber, isUndefined, isString, isObject, isNull } from 'util';

const ajv = Ajv({ allErrors: true });

const isEmpty = (value) => isNull(value) || isUndefined(value) || !value.length;

const isNonArrayObject = (value) => isObject(value) && !Array.isArray(value);

const isValidDateRange = (value) => {
  if (!isNonArrayObject(value)) {
    return false;
  }
  if (isNumber(value.from) && isNumber(value.to)) {
    return value.from <= value.to;
  }
  return true;
};

const isValidSelect = value => isString(value) && value;

const isValidGeolocation = value => isString(value.label) && isNumber(value.lat) && isNumber(value.lon);

const validateRequiredProperty = (property, value) => {
  if (property.required) {
    return !isEmpty(value);
  }
  return true;
};

const validateTextProperty = (property, value) => {
  const textProperties = [
    templateTypes.text,
    templateTypes.markdown,
    templateTypes.media,
    templateTypes.image,
    templateTypes.select
  ];
  if (textProperties.includes(property.type)) {
    return isString(value);
  }
  return true;
};

const validateNumericProperty = (property, value) => {
  if (property.type === templateTypes.numeric) {
    return isNumber(value) || value === '';
  }
  return true;
};

const validateDateProperty = (property, value) => {
  if (property.type === templateTypes.date) {
    return isNumber(value) && value >= 0;
  }
  return true;
};

const validateMultiDateProperty = (property, value) => {
  if (property.type === templateTypes.multidate) {
    return Array.isArray(value) && value.every(item => isNumber(item) || isNull(item));
  }
  return true;
};

const validateDateRangeProperty = (property, value) => {
  if (property.type === templateTypes.daterange) {
    return isValidDateRange(value);
  }
  return true;
};

const validateMultiDateRangeProperty = (property, value) => {
  if (property.type === templateTypes.multidaterange) {
    return value.every(isValidDateRange);
  }
  return true;
};

const validateGeolocationProperty = (property, value) => {
  if (property.type === templateTypes.geolocation) {
    return Array.isArray(value) && value.every(isValidGeolocation);
  }
  return true;
};

const validateMultiSelectProperty = (property, value) => {
  if ([templateTypes.multiselect, templateTypes.relationship].includes(property.type)) {
    return Array.isArray(value) && value.every(isValidSelect);
  }
  return true;
};

const validateLinkProperty = (property, value) => {
  if (property.type === templateTypes.link) {
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
    validateGeolocationProperty
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

    return template.properties.every((property) => validateMetadataField(property, entity));
  }
});

const objectIdSchema = {
  oneOf: [
    { type: 'string' },
    { type: 'object' }
  ]
};

const linkSchema = {
  type: 'object',
  required: ['label', 'url'],
  properties: {
    label: { type: 'string', minLength: 1 },
    url: { type: 'string', minLength: 1 }
  }
};

const dateRangeSchema = {
  type: 'object',
  properties: {
    from: {
      oneOf: [{ type: 'number' }, { type: 'null' }]
    },
    to: {
      oneOf: [{ type: 'number' }, { type: 'null' }]
    },
  },
  additionalProperties: false
};

const latLonSchema = {
  type: 'object',
  required: ['lon', 'lat'],
  properties: {
    label: { type: 'string' },
    lat: { type: 'number', minimum: -90, maximum: 90 },
    lon: { type: 'number', minimum: -180, maximum: 180 }
  }
};

const geolocationSchema = {
  type: 'array',
  items: latLonSchema
};

const tocSchema = {
  type: 'object',
  properties: {
    range: {
      type: 'object',
      properties: {
        start: { type: 'number' },
        end: { type: 'number' }
      }
    },
    label: { type: 'string' },
    indentation: { type: 'number' }
  }
};

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
        language: { type: 'string' }
      }
    },
    fullText: {
      type: 'object',
      patternProperties: {
        '^[0-9]+$': { type: 'string' }
      }
    },
    totalPages: { type: 'number' },
    icon: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        label: { type: 'string' },
        type: { type: 'string' }
      }
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
          size: { type: 'number' }
        }
      }
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
            chars: { type: 'number' }
          }
        }
      }
    },
    toc: {
      type: 'array',
      items: tocSchema
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
              type: 'string'
            }
          },
          {
            type: 'array',
            items: {
              type: 'number'
            }
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
            items: dateRangeSchema
          },
          linkSchema,
          geolocationSchema
        ]
      }
    },
  }
};

const validateEntity = ajv.compile(schema);

export {
  validateEntity
};
