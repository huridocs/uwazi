export const emitSchemaTypes = true;
export const SearchQuerySchema = {
  title: 'SearchQuery',
  additionalProperties: false,
  properties: {
    filter: {
      type: 'object',
      additionalProperties: false,
      properties: {
        searchString: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      },
    },
  },
};
