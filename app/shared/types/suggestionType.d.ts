/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { MetadataObjectSchema, ObjectIdSchema } from 'shared/types/commonTypes';

import { FileType } from 'shared/types/fileType';

import { EntitySchema } from 'shared/types/entityType';

export interface IXSuggestionType {
  _id?: ObjectIdSchema;
  entity: ObjectIdSchema;
  propertyName: string;
  suggestedValue: string;
  segment: string;
  language: string;
  state: 'Empty' | 'Matching' | 'Pending';
  page: number;
}

export type SuggestionType = IXSuggestionType & {
  currentValue?: {
    [k: string]: unknown | undefined;
  };
  title?: string;
  [k: string]: unknown | undefined;
};
