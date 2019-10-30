import Ajv from 'ajv';

const ajv = Ajv({ allErrors: true });

const DATA_TYPES = [
  'date',
  'geolocation',
  'multidate',
  'multidaterange',
  'multiselect',
  'numeric',
  'select',
  'text'
];

const schema = {
  $schema: 'http://json-schema.org/schema#',
  definitions: {
    property: {
      type: 'object',
      required: ['label', 'name', 'type'],
      properties: { 
        id: { type: 'string' },
        label: { type: 'string', minLength: 1 },
        name: { type: 'string', minLength: 1 },
        isCommonProperty: { type: 'boolean' },
        type: { type: 'string', enum: DATA_TYPES },
        prioritySorting: { type: 'boolean' }
      }
    }
  },
  type: 'object',
  required: ['name', 'commonProperties', 'properties'],
  properties: {
    _id: { type: 'string' },
    name: { type: 'string', minLength: 1 },
    color: { type: 'string', default: '' },
    default: { type: 'boolean', default: false },
    commonProperties: {
      type: 'array',
      minItems: 1,
      items: {
        $ref: '#/definitions/property',
      }
    },
    properties: {
      type: 'array',
      items: {
        $ref: '#/definitions/property'
      }
    }
  }
};

const validateTemplate = ajv.compile(schema);

export {
  validateTemplate
};
