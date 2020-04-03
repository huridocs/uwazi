/**
 *  Model is the type used for holding information about a classifier model.
 */

export const emitSchemaTypes = true;

export const classifierModelSchema = {
  type: 'object',
  required: ['name', 'topics'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    preferred: { type: 'string' },
    config: {
      type: 'object',
      required: ['bert'],
      properties: {
        bert: { type: 'string' },
        num_train: { type: 'number' },
        num_test: { type: 'number' },
      },
    },
    completeness: { type: 'number' },
    extraneous: { type: 'number' },
    instances: {
      type: 'array',
      items: { type: 'string' },
    },
    topics: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quality: { type: 'number' },
          samples: { type: 'number' },
        },
        additionalProperties: false,
      },
    },
  },
};
