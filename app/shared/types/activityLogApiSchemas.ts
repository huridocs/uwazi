import { objectIdSchema } from 'shared/types/commonSchemas';

const emitSchemaTypes = true;

const sortingParams = ['method', 'time', 'username', 'url'];

const ActivityLogSortPropSchema = {
  title: 'ActivityLogSortProp',
  type: 'string',
  enum: sortingParams,
};

const ActivityLogGetRequestSchema = {
  title: 'ActivityLogGetRequest',
  type: 'object',
  definitions: { objectIdSchema, ActivityLogSortPropSchema },
  properties: {
    query: {
      additionalProperties: false,
      type: 'object',
      properties: {
        user: objectIdSchema,
        username: { type: 'string' },
        find: { type: 'string' },
        time: {
          type: 'object',
          properties: {
            from: { type: 'number' },
            to: { type: 'number' },
          },
        },
        before: { type: 'number' },
        limit: { type: 'number' },
        page: { type: 'number', minimum: 1 },
        method: { type: 'array', items: { type: 'string' } },
        search: { type: 'string' },
        sort: {
          type: 'object',
          additionalProperties: false,
          properties: {
            prop: ActivityLogSortPropSchema,
            asc: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['prop', 'asc'],
        },
      },
    },
  },
};

export { ActivityLogGetRequestSchema, ActivityLogSortPropSchema, sortingParams, emitSchemaTypes };
