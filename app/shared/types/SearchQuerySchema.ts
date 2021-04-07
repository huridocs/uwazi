export const emitSchemaTypes = true;
export const SearchQuerySchema = {
  title: 'SearchQuery',
  additionalProperties: false,
  properties: {
    filter: {
      type: 'object',
      additionalProperties: false,
      properties: {
        searchQuery: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      },
    },
  },
};
