import Ajv from 'ajv';

import model from '#api/templates/templatesModel.js';
import templates from '#api/templates/index.js';
import pages from '#api/pages/index.js';
import { thesauri } from '#api/thesauri/thesauri.js';

import { ensure, wrapValidator } from '../tsUtils.js';
import { objectIdSchema, propertySchema } from './commonSchemas.js';
import { getCompatibleTypes } from '../propertyTypes.js';

import { TemplateSchema } from './templateType.js';
import { PropertySchema } from './commonTypes.js';

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
