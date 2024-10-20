/* eslint-disable max-lines */
import {
  objectIdSchema,
  propertyValueSchema,
  selectionRectanglesSchema,
} from 'shared/types/commonSchemas';
import { propertyTypes } from 'shared/propertyTypes';

const commonSuggestionMessageProperties = {
  tenant: { type: 'string', minLength: 1 },
  id: { type: 'string', minLength: 1 },
  xml_file_name: { type: 'string', minLength: 1 },
};

export const emitSchemaTypes = true;

export const CommonSuggestionSchema = {
  type: 'object',
  title: 'CommonSuggestion',
  properties: {
    ...commonSuggestionMessageProperties,
  },
  required: ['tenant', 'id', 'xml_file_name', 'segment_text'],
};

export const TextSelectionSuggestionSchema = {
  type: 'object',
  title: 'TextSelectionSuggestion',
  properties: {
    ...commonSuggestionMessageProperties,
    text: { type: 'string' },
    segment_text: { type: 'string' },
    segments_boxes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          top: { type: 'number' },
          left: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          page_number: { type: 'number' },
        },
        required: ['top', 'left', 'width', 'height', 'page_number'],
      },
    },
  },
  required: ['tenant', 'id', 'xml_file_name', 'text', 'segment_text', 'segments_boxes'],
};

export const ValuesSelectionSuggestionSchema = {
  type: 'object',
  title: 'ValuesSelectionSuggestion',
  properties: {
    ...commonSuggestionMessageProperties,
    values: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', minLength: 1 },
          label: { type: 'string', minLength: 1 },
        },
        required: ['id', 'label'],
      },
    },
    segment_text: { type: 'string' },
  },
  required: ['tenant', 'id', 'xml_file_name', 'values', 'segment_text'],
};

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
  required: [
    'labeled',
    'withValue',
    'withSuggestion',
    'hasContext',
    'processing',
    'obsolete',
    'error',
  ],
};

export const IXSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXSuggestionType',
  definitions: {
    objectIdSchema,
    propertyTypes,
    propertyValueSchema,
    IXSuggestionStateSchema,
  },
  properties: {
    _id: objectIdSchema,
    entityId: { type: 'string', minLength: 1 },
    extractorId: objectIdSchema,
    entityTemplate: { type: 'string', minLength: 1 },
    fileId: objectIdSchema,
    propertyName: { type: 'string', minLength: 1 },
    suggestedValue: {
      anyOf: [
        propertyValueSchema,
        {
          type: 'array',
          items: propertyValueSchema,
        },
      ],
    },
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
    entityTemplateId: { type: 'string', minLength: 1 },
    sharedId: { type: 'string', minLength: 1 },
    fileId: { type: 'string', minLength: 1 },
    entityTitle: { type: 'string', minLength: 1 },
    propertyName: { type: 'string', minLength: 1 },
    suggestedValue: {
      anyOf: [
        propertyValueSchema,
        {
          type: 'array',
          items: propertyValueSchema,
        },
      ],
    },
    currentValue: {
      anyOf: [
        propertyValueSchema,
        {
          type: 'array',
          items: propertyValueSchema,
        },
      ],
    },
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
    'entityTemplateId',
    'sharedId',
    'fileId',
    'suggestedValue',
    'segment',
    'language',
    'state',
    'date',
  ],
};

export const SuggestionCustomFilterSchema = {
  type: 'object',
  title: 'SuggestionCustomFilter',
  additionalProperties: false,
  properties: {
    labeled: { type: 'boolean' },
    match: { type: 'boolean' },
    mismatch: { type: 'boolean' },
    nonLabeled: { type: 'boolean' },
    obsolete: { type: 'boolean' },
    error: { type: 'boolean' },
  },
  required: ['labeled', 'nonLabeled', 'match', 'mismatch', 'obsolete', 'error'],
};

export const SuggestionsQueryFilterSchema = {
  type: 'object',
  title: 'IXSuggestionsFilter',
  additionalProperties: false,
  definitions: { objectIdSchema, SuggestionCustomFilterSchema },
  properties: {
    language: { type: 'string' },
    extractorId: objectIdSchema,
    customFilter: SuggestionCustomFilterSchema,
  },
  required: ['extractorId'],
};

export const IXSuggestionsQuerySchema = {
  type: 'object',
  title: 'IXSuggestionsQuery',
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
      required: ['number', 'size'],
    },
    sort: {
      type: 'object',
      additionalProperties: false,
      properties: {
        property: { type: 'string' },
        order: { type: 'string', enum: ['asc', 'desc'] },
      },
      required: ['property'],
    },
  },
  required: ['filter'],
};

export const IXAggregationQuerySchema = {
  type: 'object',
  title: 'IXAggregationQuery',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    extractorId: objectIdSchema,
  },
  required: ['extractorId'],
};

export const IXSuggestionAggregationSchema = {
  type: 'object',
  title: 'IXSuggestionAggregation',
  additionalProperties: false,
  required: ['total', 'labeled', 'nonLabeled', 'match', 'mismatch', 'obsolete', 'error'],
  properties: {
    total: { type: 'number' },
    labeled: { type: 'number' },
    nonLabeled: { type: 'number' },
    match: { type: 'number' },
    mismatch: { type: 'number' },
    obsolete: { type: 'number' },
    error: { type: 'number' },
  },
};
