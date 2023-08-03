const searchParamsProperties = {
  aggregateGeneratedToc: { type: 'boolean' },
  aggregatePermissionsByLevel: { type: 'boolean' },
  aggregatePermissionsByUsers: { type: 'boolean' },
  aggregatePublishingStatus: { type: 'boolean' },
  filters: { type: 'object' },
  customFilters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      generatedToc: {
        type: 'object',
        additionalProperties: false,
        properties: {
          values: { type: 'array', items: { type: 'boolean' } },
        },
      },
      permissions: {
        type: 'object',
        additionalProperties: false,
        properties: {
          values: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                refId: { type: 'string' },
                level: { type: 'string' },
              },
            },
          },
          and: { type: 'boolean' },
        },
      },
    },
  },
  types: { type: 'array', items: { type: 'string' } },
  _types: { type: 'array', items: { type: 'string' } },
  fields: { type: 'array', items: { type: 'string' } },
  include: { type: 'array', items: { type: 'string' } },
  allAggregations: { type: 'boolean' },
  aggregations: { type: 'string' },
  order: { type: 'string', enum: ['asc', 'desc'] },
  sort: { type: 'string' },
  limit: { type: 'number' },
  from: { type: 'number' },
  searchTerm: { anyOf: [{ type: 'string' }, { type: 'number' }] },
  includeUnpublished: { type: 'boolean' },
  userSelectedSorting: { type: 'boolean' },
  treatAs: { type: 'string' },
  unpublished: { type: 'boolean' },
  select: { type: 'array', items: { type: 'string' } },
  geolocation: { type: 'boolean' },
  includeReviewAggregations: { type: 'boolean' },
};

const csvExportParamsProperties = {
  ...searchParamsProperties,
  ids: { type: 'array', items: { type: 'string' } },
};

export const searchParamsSchema = {
  type: 'object',
  title: 'searchParams',
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      properties: searchParamsProperties,
    },
  },
};

export const csvExportParamsSchema = {
  type: 'object',
  title: 'csvExportParams',
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      properties: csvExportParamsProperties,
    },
  },
};

export const emitSchemaTypes = true;
