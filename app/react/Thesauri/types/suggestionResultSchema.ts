export const emitSchemaTypes = true;

export const suggestionResultSchema = {
  type: 'object',
  required: ['totalRows', 'totalSuggestions', 'thesaurus'],
  additionalProperties: false,
  properties: {
    totalRows: { type: 'number' },
    totalSuggestions: { type: 'number' },
    // suggestion queries are issued per thesaurus
    thesaurus: {
      type: 'object',
      required: ['propertyName', 'totalValues'],
      properties: {
        propertyName: { type: 'string' },
        totalValues: {
          type: 'object',
          additionalProperties: {
            type: 'number',
          },
        },
      },
    },
  },
};
