/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, PropertyValueSchema } from 'shared/types/commonTypes';

export interface IXSuggestionType {
  _id?: ObjectIdSchema;
  entityId?: ObjectIdSchema;
  entityTitle?: string;
  propertyName: string;
  propertyType?:
    | 'date'
    | 'daterange'
    | 'geolocation'
    | 'image'
    | 'link'
    | 'markdown'
    | 'media'
    | 'multidate'
    | 'multidaterange'
    | 'multiselect'
    | 'nested'
    | 'numeric'
    | 'preview'
    | 'relationship'
    | 'select'
    | 'text'
    | 'generatedid';
  suggestedValue: string;
  currentValue?: PropertyValueSchema;
  segment: string;
  language: string;
  state: 'Empty' | 'Matching' | 'Pending';
  page: number;
}
