import { objectIdSchema } from 'api/relationships.v2/database/typing/commonSchemas';
import { createDefaultValidator } from 'api/relationships.v2/validation/ajvInstances';

const emitSchemaTypes = true;

const entityInfoSchema = {
  type: 'object',
  additionalProperties: true,
  title: 'EntityInfoType',
  properties: {
    sharedId: { type: 'string' },
    title: { type: 'string' },
  },
  required: ['sharedId', 'title'],
};

const entityInfoArraySchema = {
  type: 'array',
  definitions: { entityInfoSchema },
  title: 'EntityInfoArrayType',
  items: entityInfoSchema,
};

const RelationshipDBOSchema = {
  title: 'RelationshipDBOType',
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    from: { type: 'string' },
    to: { type: 'string' },
    type: objectIdSchema,
  },
  required: ['_id', 'from', 'to', 'type'],
};
const validateRelationshipDBO = createDefaultValidator(RelationshipDBOSchema);

const JoinedRelationshipDBOSchema = {
  ...RelationshipDBOSchema,
  title: 'JoinedRelationshipDBOType',
  definitions: { entityInfoArraySchema },
  properties: {
    ...RelationshipDBOSchema.properties,
    from: entityInfoArraySchema,
    to: entityInfoArraySchema,
  },
};
const validateJoinedRelationshipDBO = createDefaultValidator(JoinedRelationshipDBOSchema);

export {
  entityInfoSchema,
  entityInfoArraySchema,
  RelationshipDBOSchema,
  validateRelationshipDBO,
  JoinedRelationshipDBOSchema,
  validateJoinedRelationshipDBO,
  emitSchemaTypes,
};
