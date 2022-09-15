import { objectIdSchema } from 'shared/types/commonSchemas';

const emitSchemaTypes = true;

const entityInfoSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    sharedId: { type: 'string' },
    title: { type: 'string' },
  },
  required: ['sharedId', 'title'],
};

const entityInfoArraySchema = {
  type: 'array',
  definitions: { entityInfoSchema },
  items: entityInfoSchema,
};

const RelationshipDBOSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    from: { type: 'string' },
    to: { type: 'string' },
    type: objectIdSchema,
  },
  required: ['_id', 'from', 'to', 'type'],
};

const JoinedRelationshipDBOSchema = {
  ...RelationshipDBOSchema,
  definitions: { ...RelationshipDBOSchema.definitions, entityInfoArraySchema },
  properties: {
    ...RelationshipDBOSchema.properties,
    from: entityInfoArraySchema,
    to: entityInfoArraySchema,
  },
};

export {
  entityInfoSchema,
  entityInfoArraySchema,
  RelationshipDBOSchema,
  JoinedRelationshipDBOSchema,
  emitSchemaTypes,
};
