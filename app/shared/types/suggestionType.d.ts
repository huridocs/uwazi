/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, PropertyValueSchema } from 'shared/types/commonTypes';

export interface EntitySuggestionType {
  _id?: ObjectIdSchema;
  entityId: string;
  sharedId: string;
  fileId: string;
  entityTitle: string;
  propertyName: string;
  suggestedValue: PropertyValueSchema;
  currentValue?: PropertyValueSchema;
  segment: string;
  language: string;
  state: 'Empty' | 'Matching' | 'Pending';
  page?: number;
  status?: 'processing' | 'failed' | 'ready';
  date: number;
}

export interface IXSuggestionType {
  _id?: ObjectIdSchema;
  entityId: string;
  fileId?: ObjectIdSchema;
  propertyName: string;
  suggestedValue: PropertyValueSchema;
  segment: string;
  language: string;
  page?: number;
  status?: 'processing' | 'failed' | 'ready';
  date?: number;
  error?: string;
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
  propertyName: string;
  state?: 'Empty' | 'Matching' | 'Pending';
}
