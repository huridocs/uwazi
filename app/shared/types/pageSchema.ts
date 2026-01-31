import Ajv from 'ajv';
import { objectIdSchema } from '#shared/types/commonSchemas.js';

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

export const PageSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  validatePageIsNotEntityView: true,
  additionalProperties: false,
  title: 'PageType',
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    title: { type: 'string' },
    language: { type: 'string' },
    sharedId: { type: 'string' },
    creationDate: { type: 'number' },
    metadata: {
      type: 'object',
      additionalProperties: false,
      definitions: { objectIdSchema },
      properties: {
        _id: objectIdSchema,
        content: { type: 'string' },
        script: { type: 'string' },
      },
    },
    user: objectIdSchema,
    entityView: { type: 'boolean' },
    __v: { type: 'number' },
  },
  required: ['title'],
};

export const emitSchemaTypes = true;
