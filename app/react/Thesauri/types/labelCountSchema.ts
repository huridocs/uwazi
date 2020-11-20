export const emitSchemaTypes = true;

export const labelCountSchema = {
  type: 'object',
  required: ['totalRows', 'totalLabels', 'thesaurus'],
  additionalProperties: false,
  properties: {
    totalRows: { type: 'number' },
    totalLabels: { type: 'number' },
    // suggestion queries are issued per thesaurus
    thesaurus: {
      type: 'object',
      required: ['propertyName', 'totalValues'],
      properties: {
        propertyName: { type: 'string' },
        values: { type: 'array', tsType: 'any' },
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
