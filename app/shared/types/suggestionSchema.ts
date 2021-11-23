import { objectIdSchema, propertyValueSchema } from 'shared/types/commonSchemas';
import { propertyTypes } from 'shared/propertyTypes';

export const emitSchemaTypes = true;

export enum SuggestionState {
  empty = 'Empty',
  matching = 'Matching',
  pending = 'Pending',
}

export const IXSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXSuggestionType',
  definitions: { objectIdSchema, propertyTypes, propertyValueSchema },
  properties: {
    _id: objectIdSchema,
    entityId: { type: 'string', minLength: 1 },
    entityTitle: { type: 'string', minLength: 1 },
    propertyName: { type: 'string', minLength: 1 },
    propertyType: { type: 'string', enum: Object.values(propertyTypes) },
    suggestedValue: { type: 'string', minLength: 1 }, //text
    currentValue: propertyValueSchema,
    segment: { type: 'string', minLength: 1 }, //segment/text
    language: { type: 'string', minLength: 1 },
    state: { type: 'string', enum: Object.values(SuggestionState) }, //?
    page: { type: 'number', minimum: 1 },
  },
  required: ['propertyName', 'entity', 'suggestedValue', 'segment', 'language', 'state', 'page'],
};
