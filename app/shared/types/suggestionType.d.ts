/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface SuggestionType {
  propertyName: string;
  currentValue?: string;
  suggestedValue: string;
  segment: string;
  language: string;
  state: 'Empty' | 'Filled';
  page: number;
}
