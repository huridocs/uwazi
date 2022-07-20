import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const IXModelSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXModelType',
  definitions: { objectIdSchema },
  required: ['propertyName', 'creationDate'],
  properties: {
    _id: objectIdSchema,
    propertyName: { type: 'string', minLength: 1 },
    creationDate: { type: 'number' },
    status: { type: 'string', enum: ['processing', 'failed', 'ready'], default: 'processing' },
  },
};
