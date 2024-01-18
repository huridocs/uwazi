import { objectIdSchema } from 'shared/types/commonSchemas';
import { entitySchema } from 'shared/types/entitySchema';

export const emitSchemaTypes = true;

export const connectionSchema = {
  definitions: { objectIdSchema, entitySchema },
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    hub: objectIdSchema,
    template: {
      oneOf: [{ type: 'null' }, objectIdSchema],
    },
    file: objectIdSchema,
    entity: { type: 'string' },
    entityData: entitySchema,
    reference: {
      type: 'object',
      additionalProperties: false,
      required: ['text', 'selectionRectangles'],
      properties: {
        text: { type: 'string' },
        selectionRectangles: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['top', 'left', 'width', 'height', 'page'],
            properties: {
              top: { type: 'number' },
              left: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
              page: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
