/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import {
  ObjectIdSchema,
  PropertyValueSchema,
  SelectionRectanglesSchema,
} from 'shared/types/commonTypes';

export interface CommonSuggestion {
  tenant: string;
  id: string;
  xml_file_name: string;
  [k: string]: unknown | undefined;
}

export interface EntitySuggestionType {
  _id?: ObjectIdSchema;
  entityId: string;
  extractorId: string;
  entityTemplateId: string;
  sharedId: string;
  fileId: string;
  entityTitle: string;
  propertyName: string;
  suggestedValue: PropertyValueSchema | PropertyValueSchema[];
  currentValue?: PropertyValueSchema | PropertyValueSchema[];
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
  state: IXSuggestionStateType;
  page?: number;
  status?: 'processing' | 'failed' | 'ready';
  date: number;
}

export interface IXAggregationQuery {
  extractorId: ObjectIdSchema;
}

export interface IXSuggestionAggregation {
  total: number;
  labeled: {
    _count: number;
    match: number;
    mismatch: number;
  };
  nonLabeled: {
    _count: number;
    withSuggestion: number;
    noSuggestion: number;
    noContext: number;
    obsolete: number;
    others: number;
  };
}

export interface IXSuggestionType {
  _id?: ObjectIdSchema;
  entityId: string;
  extractorId: ObjectIdSchema;
  entityTemplate: string;
  fileId?: ObjectIdSchema;
  propertyName: string;
  suggestedValue: PropertyValueSchema | PropertyValueSchema[];
  suggestedText?: string;
  segment?: string;
  language: string;
  page?: number;
  status?: 'processing' | 'failed' | 'ready';
  state?: IXSuggestionStateType;
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

export interface IXSuggestionStateType {
  labeled: boolean;
  withValue: boolean;
  withSuggestion: boolean;
  match: boolean;
  hasContext: boolean;
  obsolete: boolean;
  processing: boolean;
  error: boolean;
}

export interface IXSuggestionsQuery {
  filter: IXSuggestionsFilter;
  page?: {
    number: number;
    size: number;
  };
  sort?: {
    property: string;
    order?: 'asc' | 'desc';
  };
  [k: string]: unknown | undefined;
}

export interface SuggestionCustomFilter {
  labeled: {
    match: boolean;
    mismatch: boolean;
  };
  nonLabeled: {
    withSuggestion: boolean;
    noSuggestion: boolean;
    noContext: boolean;
    obsolete: boolean;
    others: boolean;
  };
}

export interface IXSuggestionsFilter {
  language?: string;
  extractorId: ObjectIdSchema;
  customFilter?: SuggestionCustomFilter;
}

export interface TextSelectionSuggestion {
  tenant: string;
  id: string;
  xml_file_name: string;
  text: string;
  segment_text: string;
  segments_boxes: {
    top: number;
    left: number;
    width: number;
    height: number;
    page_number: number;
  }[];
  [k: string]: unknown | undefined;
}

export interface ValuesSelectionSuggestion {
  tenant: string;
  id: string;
  xml_file_name: string;
  values: {
    id: string;
    label: string;
  }[];
  segment_text: string;
  [k: string]: unknown | undefined;
}
