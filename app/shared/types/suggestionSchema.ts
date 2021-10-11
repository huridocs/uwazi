import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export enum SuggestionState {
  empty = 'Empty',
  filled = 'Filled',
}

export const SuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'SuggestionType',
  definitions: { objectIdSchema },
  properties: {
    currentValue: { type: 'string' },
    suggestedValue: { type: 'string', minLength: 1 },
    segment: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    state: { type: 'string', enum: Object.values(SuggestionState) },
    page: { type: 'number', minimum: 1 },
  },
  required: ['propertyName', 'suggestedValue', 'segment', 'language', 'state', 'page'],
};
