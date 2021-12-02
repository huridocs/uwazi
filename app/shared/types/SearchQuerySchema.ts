export const emitSchemaTypes = true;

export const RangeQuerySchema = {
  title: 'RangeQuery',
  additionalProperties: false,
  properties: { from: { type: 'number' }, to: { type: 'number' } },
};

export const AdvancedQuerySchema = {
  title: 'AdvancedQuery',
  additionalProperties: false,
  properties: {
    values: { type: 'array', items: { type: 'string' } },
    operator: { type: 'string', enum: ['AND', 'OR'] },
  },
};

export const SearchQuerySchema = {
  title: 'SearchQuery',
  additionalProperties: false,
  properties: {
    page: {
      type: 'object',
      additionalProperties: false,
      properties: { limit: { type: 'number' }, offset: { type: 'number' } },
    },
    filter: {
      type: 'object',
      additionalProperties: {
        anyOf: [
          RangeQuerySchema,
          AdvancedQuerySchema,
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
        ],
      },
      properties: {
        searchString: { type: 'string' },
        sharedId: { type: 'string' },
        published: { type: 'boolean' },
      },
    },
    sort: { type: 'string' },
    fields: { type: 'array', items: { type: 'string', minlength: 1 } },
  },
};
