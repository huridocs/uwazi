import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export enum ModelStatus {
  processing = 'processing',
  failed = 'failed',
  ready = 'ready',
}

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
    status: { type: 'string', enum: Object.values(ModelStatus), default: ModelStatus.processing },
    findingSuggestions: { type: 'boolean', default: true },
  },
};
