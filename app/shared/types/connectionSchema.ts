import { objectIdSchema } from 'shared/types/commonSchemas';
import { entitySchema } from 'shared/types/entitySchema';

export const emitSchemaTypes = true;

export const connectionSchema = {
  definitions: { objectIdSchema },
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    hub: objectIdSchema,
    template: objectIdSchema,
    file: objectIdSchema,
    entity: 'string',
    entityData: entitySchema,
    reference: {
      type: 'object',
      properties: {
        text: 'string',
        selectionRectangles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              top: { type: 'number' },
              left: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
              regionId: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
