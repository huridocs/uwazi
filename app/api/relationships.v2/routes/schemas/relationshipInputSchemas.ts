const emitSchemaTypes = true;

const Selection = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'number' },
    top: { type: 'number' },
    left: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
  },
  required: ['page', 'top', 'left', 'width', 'height'],
};

const Pointer = {
  oneOf: [
    { type: 'string' },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        entity: { type: 'string' },
        file: { type: 'string' },
        selections: { type: 'array', items: Selection },
        text: { type: 'string' },
      },
      required: ['entity', 'file', 'selections', 'text'],
    },
  ],
};

const RelationshipInputSchema = {
  title: 'RelationshipInputType',
  type: 'object',
  additionalProperties: false,
  properties: {
    from: Pointer,
    to: Pointer,
    type: { type: 'string' },
  },
  required: ['from', 'to', 'type'],
};

const RelationshipInputArraySchema = {
  title: 'RelationshipInputArrayType',
  type: 'array',
  minItems: 1,
  items: RelationshipInputSchema,
};

export { emitSchemaTypes, RelationshipInputSchema, RelationshipInputArraySchema };
