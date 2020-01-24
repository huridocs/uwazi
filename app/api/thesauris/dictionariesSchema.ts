/** @format */

import { objectIdSchema } from 'shared/commonSchemas';

export const emitSchemaTypes = true;

export const thesaurusSchema = {
  $async: true,
  type: 'object',
  required: ['name'],
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    type: { type: 'string', enum: ['thesauri'] },
    name: {
      type: 'string',
      uniqueName: '',
      minLength: 1,
    },
    enable_classification: { type: 'boolean' },
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
              },
            },
          },
        },
      },
    },
  },
};
