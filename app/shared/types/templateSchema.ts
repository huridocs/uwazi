import Ajv from 'ajv';

import { objectIdSchema, propertySchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

export const templateSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  required: ['name'],
  definitions: { objectIdSchema, propertySchema },
  properties: {
    _id: objectIdSchema,
    name: { type: 'string', minLength: 1 },
    color: { type: 'string', default: '' },
    default: { type: 'boolean', default: false },
    entityViewPage: { type: 'string', default: '' },
    synced: { type: 'boolean' },
    processing: {
      type: 'object',
      additionalProperties: false,
      properties: {
        active: { type: 'boolean' },
        totalJobs: { type: 'number' },
        completedJobs: { type: 'number' },
      },
    },
    commonProperties: {
      type: 'array',
      minItems: 1,
      items: propertySchema,
    },
    properties: {
      type: 'array',
      items: propertySchema,
    },
  },
};
