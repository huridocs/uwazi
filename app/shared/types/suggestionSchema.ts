import { metadataObjectSchema, objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export enum SuggestionState {
  empty = 'Empty',
  filled = 'Filled',
}

export const IXSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXSuggestionType',
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    entity: objectIdSchema,
    propertyName: { type: 'string', minLength: 1 },
    suggestedValue: { type: 'string', minLength: 1 }, //text
    segment: { type: 'string', minLength: 1 }, //segment/text
    language: { type: 'string', minLength: 1 },
    state: { type: 'string', enum: Object.values(SuggestionState) }, //?
    page: { type: 'number', minimum: 1 },
  },
  required: ['propertyName', 'entity', 'suggestedValue', 'segment', 'language', 'state', 'page'],
};

export const SuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'SuggestionType',
  definitions: { objectIdSchema, metadataObjectSchema },
  properties: {
    ...IXSuggestionSchema,
    currentValue: { type: metadataObjectSchema },
    title: { type: 'string', minLength: 1 },
  },
};
