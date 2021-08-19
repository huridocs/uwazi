export const emitSchemaTypes = true;
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
        anyOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: { from: { type: 'number' }, to: { type: 'number' } },
          },
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
        ],
      },
      properties: {
        searchString: { anyOf: [{ type: 'string' }, { type: 'number' }] },
        sharedId: { type: 'string' },
        published: { type: 'boolean' },
      },
    },
    fields: { type: 'array', items: { type: 'string', minlength: 1 } },
  },
};
