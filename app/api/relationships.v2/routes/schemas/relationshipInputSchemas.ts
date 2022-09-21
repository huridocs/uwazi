const emitSchemaTypes = true;

const RelationshipInputSchema = {
  title: 'RelationshipInputType',
  type: 'object',
  additionalProperties: false,
  properties: {
    from: { type: 'string' },
    to: { type: 'string' },
    type: { type: 'string' },
  },
  required: ['from', 'to', 'type'],
};

const RelationshipInputArraySchema = {
  title: 'RelationshipInputArrayType',
  type: 'array',
  items: RelationshipInputSchema,
};

export { emitSchemaTypes, RelationshipInputSchema, RelationshipInputArraySchema };
