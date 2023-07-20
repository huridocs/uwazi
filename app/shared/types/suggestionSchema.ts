import {
  objectIdSchema,
  propertyValueSchema,
  selectionRectanglesSchema,
} from 'shared/types/commonSchemas';
import { propertyTypes } from 'shared/propertyTypes';

export const emitSchemaTypes = true;

export const IXSuggestionStateSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXSuggestionStateType',
  properties: {
    labeled: { type: 'boolean' },
    withValue: { type: 'boolean' },
    withSuggestion: { type: 'boolean' },
    match: { type: 'boolean' },
    hasContext: { type: 'boolean' },
    obsolete: { type: 'boolean' },
    processing: { type: 'boolean' },
    error: { type: 'boolean' },
  },
  required: ['labeled', 'withSuggestion', 'match', 'hasContext', 'obsolete', 'processing', 'error'],
};

export const IXSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXSuggestionType',
  definitions: { objectIdSchema, propertyTypes, propertyValueSchema, IXSuggestionStateSchema },
  properties: {
    _id: objectIdSchema,
    entityId: { type: 'string', minLength: 1 },
    extractorId: objectIdSchema,
    entityTemplate: { type: 'string', minLength: 1 },
    fileId: objectIdSchema,
    propertyName: { type: 'string', minLength: 1 },
    suggestedValue: propertyValueSchema,
    suggestedText: { type: 'string' },
    segment: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    page: { type: 'number', minimum: 1 },
    status: { type: 'string', enum: ['processing', 'failed', 'ready'] },
    state: IXSuggestionStateSchema,
    date: { type: 'number' },
    error: { type: 'string' },
    selectionRectangles: selectionRectanglesSchema,
  },
  required: [
    'propertyName',
    'entityId',
    'extractorId',
    'entityTemplate',
    'suggestedValue',
    'segment',
    'language',
  ],
};

export const EntitySuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'EntitySuggestionType',
  definitions: { objectIdSchema, propertyTypes, propertyValueSchema, IXSuggestionStateSchema },
  properties: {
    _id: objectIdSchema,
    entityId: { type: 'string', minLength: 1 },
    extractorId: { type: 'string', minLength: 1 },
    sharedId: { type: 'string', minLength: 1 },
    fileId: { type: 'string', minLength: 1 },
    entityTitle: { type: 'string', minLength: 1 },
    propertyName: { type: 'string', minLength: 1 },
    suggestedValue: propertyValueSchema,
    currentValue: propertyValueSchema,
    labeledValue: propertyValueSchema,
    selectionRectangles: selectionRectanglesSchema,
    segment: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    state: IXSuggestionStateSchema,
    page: { type: 'number', minimum: 1 },
    status: { type: 'string', enum: ['processing', 'failed', 'ready'] },
    date: { type: 'number' },
  },
  required: [
    'propertyName',
    'entityTitle',
    'entityId',
    'extractorId',
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
  definitions: { objectIdSchema },
  properties: {
    language: { type: 'string' },
    extractorId: objectIdSchema,
    // states: { type: 'array', items: { type: 'string', enum: Object.values(SuggestionState) } },
    entityTemplates: { type: 'array', items: { type: 'string' } },
  },
  required: ['extractorId'],
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
