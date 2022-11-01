const PageSchema = {
  title: 'Page',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    limit: { type: 'number' },
    offset: { type: 'number' },
  },
};

const CompoundFilterSchema = {
  title: 'CompoundFilter',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    values: { type: 'array', items: { type: 'string' } },
    operator: { type: 'string', enum: ['AND', 'OR'] },
  },
};

const RangeFilterSchema = {
  title: 'RangeFilter',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    from: { type: 'number' },
    to: { type: 'number' },
  },
};

const searchGetParameters = [
  {
    in: 'query',
    name: 'page',
    schema: PageSchema,
    style: 'deepObject',
  },
  {
    in: 'query',
    name: 'filter',
    schema: {
      type: 'object',
      required: [],
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
    style: 'deepObject',
  },
  {
    in: 'query',
    name: 'sort',
    schema: { type: 'string' },
    style: 'deepObject',
  },
  {
    in: 'query',
    name: 'fields',
    schema: { type: 'array', items: { type: 'string', minLength: 1 } },
    style: 'deepObject',
  },
] as const;

type propertyNames = typeof searchGetParameters[number]['name'];
type propertyValue = typeof searchGetParameters[number]['schema'];

const properties = searchGetParameters.reduce(
  (props, parameter) => ({
    ...props,
    [parameter.name]: parameter.schema,
  }),
  {} as { [key in propertyNames]: propertyValue }
);

export const SearchQuerySchema = {
  title: 'SearchQuery',
  type: 'object',
  additionalProperties: false,
  properties,
};

export const emitSchemaTypes = true;
export { RangeFilterSchema, PageSchema, CompoundFilterSchema, searchGetParameters };
