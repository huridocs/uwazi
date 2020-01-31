/**
 *  Model is the type used for holding information about a classifier model.
 *
 * @format
 */

export const emitSchemaTypes = true;

export const classifierModelSchema = {
  type: 'object',
  required: ['name', 'topics'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    preferred: { type: 'string' },
    bert: { type: 'string' },
    sample: { type: 'number' },
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
          name: 'string',
          quality: 'number',
          samples: 'number',
        },
      },
    },
  },
};
