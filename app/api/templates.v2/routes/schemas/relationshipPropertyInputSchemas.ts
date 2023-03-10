const emitSchemaTypes = true;

const TraverseInputSchema: {
  title: string;
  type: string;
  definitions?: Object | undefined;
  items?: Object | undefined;
} = {
  title: 'TraverseInputType',
  type: 'array',
};

const MatchQueryInputSchema = {
  title: 'MatchQueryInputType',
  type: 'object',
  additionalProperties: false,
  definitions: { TraverseInputSchema },
  properties: {
    templates: {
      type: 'array',
      items: { type: 'string' },
    },
    traverse: {
      type: 'array',
      items: TraverseInputSchema,
    },
  },
  required: ['templates'],
};

enum TraverseDirections {
  IN = 'in',
  OUT = 'out',
}

const TraverseQueryInputSchema = {
  title: 'TraverseQueryInputType',
  type: 'object',
  additionalProperties: false,
  defitions: { MatchQueryInputSchema },
  properties: {
    direction: {
      type: 'string',
      enum: Object.values(TraverseDirections),
    },
    types: {
      type: 'array',
      items: { type: 'string' },
    },
    match: MatchQueryInputSchema,
  },
  required: ['direction', 'types', 'match'],
};

TraverseInputSchema.definitions = { TraverseQueryInputSchema };
TraverseInputSchema.items = TraverseQueryInputSchema;

export { emitSchemaTypes, MatchQueryInputSchema, TraverseInputSchema, TraverseQueryInputSchema };
