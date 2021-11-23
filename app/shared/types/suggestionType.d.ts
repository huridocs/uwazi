/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, PropertyValueSchema } from 'shared/types/commonTypes';

export interface IXSuggestionType {
  _id?: ObjectIdSchema;
  entityId?: string;
  entityTitle?: string;
  propertyName: string;
  suggestedValue: string;
  currentValue?: PropertyValueSchema;
  segment: string;
  language: string;
  state: 'Empty' | 'Matching' | 'Pending';
  page: number;
  creationDate?: number;
}
