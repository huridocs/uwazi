import {
  objectIdSchema,
  propertyValueSchema,
  selectionRectanglesSchema,
} from 'shared/types/commonSchemas';
import { propertyTypes } from 'shared/propertyTypes';

export const emitSchemaTypes = true;

export enum SuggestionState {
  labelMatch = 'Match / Label',
  labelMismatch = 'Mismatch / Label',
  valueMatch = 'Match / Value',
  valueMismatch = 'Mismatch / Value',
  empty = 'Empty / Empty',
  obsolete = 'Obsolete',
  labelEmpty = 'Empty / Label',
  valueEmpty = 'Empty / Value',
  error = 'Error',
}

export const IXSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXSuggestionType',
  definitions: { objectIdSchema, propertyTypes, propertyValueSchema },
  properties: {
    _id: objectIdSchema,
    entityId: { type: 'string', minLength: 1 },
    fileId: objectIdSchema,
    propertyName: { type: 'string', minLength: 1 },
    suggestedValue: propertyValueSchema,
    suggestedText: { type: 'string' },
    segment: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    page: { type: 'number', minimum: 1 },
    status: { type: 'string', enum: ['processing', 'failed', 'ready'] },
    date: { type: 'number' },
    error: { type: 'string' },
    selectionRectangles: selectionRectanglesSchema,
  },
  required: ['propertyName', 'entityId', 'suggestedValue', 'segment', 'language'],
};

export const EntitySuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'EntitySuggestionType',
  definitions: { objectIdSchema, propertyTypes, propertyValueSchema },
  properties: {
    _id: objectIdSchema,
    entityId: { type: 'string', minLength: 1 },
    sharedId: { type: 'string', minLength: 1 },
    fileId: { type: 'string', minLength: 1 },
    entityTitle: { type: 'string', minLength: 1 },
    propertyName: { type: 'string', minLength: 1 },
    suggestedValue: propertyValueSchema,
    currentValue: propertyValueSchema,
    segment: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    state: { type: 'string', enum: Object.values(SuggestionState) },
    page: { type: 'number', minimum: 1 },
    status: { type: 'string', enum: ['processing', 'failed', 'ready'] },
    date: { type: 'number' },
  },
  required: [
    'propertyName',
    'entityTitle',
    'entityId',
    'sharedId',
    'fileId',
    'suggestedValue',
    'segment',
    'language',
    'state',
    'date',
  ],
};

export const SuggestionsQueryFilterSchema = {
  type: 'object',
  title: 'IXSuggestionsFilter',
  additionalProperties: false,
  properties: {
    language: { type: 'string' },
    propertyName: { type: 'string' },
    state: { type: 'string', enum: Object.values(SuggestionState) },
  },
  required: ['propertyName'],
};

export const IXSuggestionsQuerySchema = {
  type: 'object',
  title: 'IXSuggestionsQuery',
  additionalProperties: false,
  definitions: { SuggestionsQueryFilterSchema },
  properties: {
    filter: SuggestionsQueryFilterSchema,
    page: {
      type: 'object',
      additionalProperties: false,
      properties: {
        number: { type: 'number', minimum: 1 },
        size: { type: 'number', minimum: 1, maximum: 500 },
      },
    },
  },
};
