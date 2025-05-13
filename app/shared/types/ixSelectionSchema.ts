import Ajv from 'ajv';
import { syncWrapValidator } from 'shared/tsUtils';
import { IXSelections } from './ixSelectionType';

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

export const emitSchemaTypes = true;

export const IXSelectionSourceSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXSelectionSource',
  properties: {
    type: { type: 'string', enum: ['file', 'entity_property'] },
    id: { type: 'string', minLength: 1 },
    propertyName: { type: 'string' },
  },
  required: ['type', 'id'],
};

export const IXSelectionsSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXSelections',
  properties: {
    language: { type: 'string', minLength: 1 },
    source: IXSelectionSourceSchema,
    selections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          propertyID: { type: 'string', minLength: 1 },
          timestamp: { type: 'string', minLength: 1 },
          selection: {
            type: 'object',
            additionalProperties: false,
            properties: {
              text: { type: 'string', minLength: 1 },
              selectionRectangles: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    top: { type: 'number' },
                    left: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    page: { type: 'string' },
                  },
                  required: ['top', 'left', 'width', 'height'],
                },
              },
            },
            required: ['text'],
          },
        },
        required: ['selection'],
      },
    },
  },
  required: ['source', 'selections', 'language'],
};

export function validateIxSelection(ixSelection: any): asserts ixSelection is IXSelections {
  syncWrapValidator(ajv.compile(IXSelectionsSchema))(ixSelection);
}
