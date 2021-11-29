/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, PropertyValueSchema } from 'shared/types/commonTypes';

export interface IXSuggestionType {
  _id?: ObjectIdSchema;
  entityId: string;
  entityTitle?: string;
  propertyName: string;
  suggestedValue: PropertyValueSchema;
  currentValue?: PropertyValueSchema;
  segment: string;
  language: string;
  state?: 'Empty' | 'Matching' | 'Pending';
  page: number;
  creationDate?: number;
}

export interface IXSuggestionsFilter {
  propertyName?: string;
  state?: 'Empty' | 'Matching' | 'Pending';
}

export interface IXSuggestionsQuery {
  filter?: IXSuggestionsFilter;
  page?: {
    number?: number;
    size?: number;
  };
}
