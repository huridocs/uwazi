/** @format */

import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const thesaurusValueSchema = {
  type: 'object',
  definitions: { objectIdSchema },
  required: ['label'],
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    id: {
      type: 'string',
      minLength: 1,
    },
    label: {
      type: 'string',
      minLength: 1,
    },
    values: {
      type: 'array',
      items: {
        type: 'object',
        required: ['label'],
        additionalProperties: false,
        properties: {
          _id: objectIdSchema,
          id: {
            type: 'string',
            minLength: 1,
          },
          label: {
            type: 'string',
            minLength: 1,
          },
          name: { type: 'string' },
        },
      },
    },
  },
};

export const thesaurusSchema = {
  $async: true,
  type: 'object',
  required: ['name'],
  definitions: { objectIdSchema, thesaurusValueSchema },
  uniqueName: true,
  uniqueLabels: true,
  properties: {
    _id: objectIdSchema,
    type: { type: 'string', enum: ['thesauri', 'template'] },
    name: {
      type: 'string',
      minLength: 1,
    },
    enable_classification: { type: 'boolean' },
    values: {
      type: 'array',
      items: thesaurusValueSchema,
    },
  },
};
