import { objectIdSchema } from 'api/common.v2/database/schemas/commonSchemas';

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

const RelationshipReferencePointer = {
  type: 'object',
  additionalProperties: false,
  properties: {
    entity: { type: 'string' },
    file: objectIdSchema,
    selections: { type: 'array', items: Selection },
    text: { type: 'string' },
  },
  required: ['entity', 'file', 'selections', 'text'],
};

const RelationshipEntityPointer = {
  type: 'object',
  additionalProperties: false,
  properties: {
    entity: { type: 'string' },
  },
  required: ['entity'],
};

const Pointer = {
  oneOf: [RelationshipReferencePointer, RelationshipEntityPointer],
};

const RelationshipDBOSchema = {
  title: 'RelationshipDBOType',
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    from: Pointer,
    to: Pointer,
    type: objectIdSchema,
  },
  required: ['_id', 'from', 'to', 'type'],
};

export { RelationshipDBOSchema, emitSchemaTypes };
