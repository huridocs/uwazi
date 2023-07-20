/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import {
  ObjectIdSchema,
  PropertyValueSchema,
  SelectionRectanglesSchema,
} from 'shared/types/commonTypes';

export interface EntitySuggestionType {
  _id?: ObjectIdSchema;
  entityId: string;
  extractorId: string;
  sharedId: string;
  fileId: string;
  entityTitle: string;
  propertyName: string;
  suggestedValue: PropertyValueSchema;
  currentValue?: PropertyValueSchema;
  labeledValue?: PropertyValueSchema;
  selectionRectangles?: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    page?: string;
  }[];
  segment: string;
  language: string;
  state:
    | 'Match / Label'
    | 'Mismatch / Label'
    | 'Match / Value'
    | 'Mismatch / Value'
    | 'Empty / Empty'
    | 'Obsolete'
    | 'Empty / Label'
    | 'Empty / Value'
    | 'Error'
    | 'Processing'
    | 'Mismatch / Empty';
  page?: number;
  status?: 'processing' | 'failed' | 'ready';
  date: number;
}

export interface IXSuggestionType {
  _id?: ObjectIdSchema;
  entityId: string;
  extractorId: ObjectIdSchema;
  entityTemplate: string;
  fileId?: ObjectIdSchema;
  propertyName: string;
  suggestedValue: PropertyValueSchema;
  suggestedText?: string;
  segment: string;
  language: string;
  page?: number;
  status?: 'processing' | 'failed' | 'ready';
  state?:
    | 'Match / Label'
    | 'Mismatch / Label'
    | 'Match / Value'
    | 'Mismatch / Value'
    | 'Empty / Empty'
    | 'Obsolete'
    | 'Empty / Label'
    | 'Empty / Value'
    | 'Error'
    | 'Processing'
    | 'Mismatch / Empty';
  date?: number;
  error?: string;
  selectionRectangles?: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    page?: string;
  }[];
}

export interface IXSuggestionsQuery {
  filter?: IXSuggestionsFilter;
  page?: {
    number?: number;
    size?: number;
  };
}

export interface IXSuggestionsFilter {
  language?: string;
  extractorId: ObjectIdSchema;
  states?: (
    | 'Match / Label'
    | 'Mismatch / Label'
    | 'Match / Value'
    | 'Mismatch / Value'
    | 'Empty / Empty'
    | 'Obsolete'
    | 'Empty / Label'
    | 'Empty / Value'
    | 'Error'
    | 'Processing'
    | 'Mismatch / Empty'
  )[];
  entityTemplates?: string[];
}
