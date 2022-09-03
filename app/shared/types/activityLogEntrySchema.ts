import { objectIdSchema } from 'shared/types/commonSchemas';

const emitSchemaTypes = true;

const activityLogSemanticSchema = {
  title: 'ActivityLogSemanticType',
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    description: { type: 'string' },
    action: { type: 'string', enum: ['UPDATE', 'DELETE', 'RAW', 'MIGRATE', 'WARNING'] },
    name: { type: 'string' },
    extra: { type: 'string' },
  },
  required: ['description', 'action', 'name'],
};

const activityLogEntrySchema = {
  title: 'ActivityLogEntryType',
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema, activityLogSemanticSchema },
  properties: {
    _id: objectIdSchema,
    method: { type: 'string', enum: ['UPDATE', 'DELETE', 'RAW', 'MIGRATE', 'WARNING'] },
    body: { type: 'string' },
    semantic: activityLogSemanticSchema,
    query: { type: 'string' },
    username: { type: 'string' },
    user: objectIdSchema,
    time: { type: 'number' },
    url: { type: 'string' },
  },
  required: ['_id', 'method', 'semantic', 'user'],
};

export { emitSchemaTypes, activityLogEntrySchema, activityLogSemanticSchema };
