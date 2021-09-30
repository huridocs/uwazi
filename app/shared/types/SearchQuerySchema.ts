export const emitSchemaTypes = true;

export const RangeQuerySchema = {
  title: 'RangeQuery',
  additionalProperties: false,
  properties: { from: { type: 'number' }, to: { type: 'number' } },
};

export const SearchQuerySchema = {
  title: 'SearchQuery',
  additionalProperties: false,
  properties: {
    page: {
      type: 'object',
      additionalProperties: false,
      properties: { limit: { type: 'number' } },
    },
    filter: {
      type: 'object',
      additionalProperties: {
        anyOf: [RangeQuerySchema, { type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      },
      properties: {
        searchString: { type: 'string' },
        sharedId: { type: 'string' },
        published: { type: 'boolean' },
      },
    },
    fields: { type: 'array', items: { type: 'string', minlength: 1 } },
  },
};
