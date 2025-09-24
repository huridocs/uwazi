import { objectIdSchema } from 'shared/types/commonSchemas.js';
// @ts-expect-error TS(2307): Cannot find module './types/entitySchema.js' or it... Remove this comment to see the full error message
import { entitySchema } from './types/entitySchema.js';

export const emitSchemaTypes = true;

export const connectionSchema = {
  definitions: { objectIdSchema, entitySchema },
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    __v: { type: 'number' },
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
