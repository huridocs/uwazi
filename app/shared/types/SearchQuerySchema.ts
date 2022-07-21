export const emitSchemaTypes = true;

export const PageSchema = {
  title: 'Page',
  type: 'object',
  additionalProperties: false,
  properties: { limit: { type: 'number' }, offset: { type: 'number' } },
};

export const RangeFilterSchema = {
  title: 'RangeFilter',
  type: 'object',
  additionalProperties: false,
  properties: { from: { type: 'number' }, to: { type: 'number' } },
};

export const CompoundFilterSchema = {
  title: 'CompoundFilter',
  type: 'object',
  additionalProperties: false,
  properties: {
    values: { type: 'array', items: { type: 'string' } },
    operator: { type: 'string', enum: ['AND', 'OR'] },
  },
};

export const SearchQuerySchema = {
  title: 'SearchQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    page: PageSchema,
    filter: {
      type: 'object',
      additionalProperties: {
        anyOf: [
          RangeFilterSchema,
          CompoundFilterSchema,
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
    fields: { type: 'array', items: { type: 'string', minLength: 1 } },
  },
};
