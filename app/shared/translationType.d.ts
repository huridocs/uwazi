/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { LanguageISO6391, ObjectIdSchema } from 'shared/types/commonTypes';

export interface TranslationContext {
  _id?: ObjectIdSchema;
  id?: string;
  label?: string;
  type?: 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';
  values?: TranslationValue[];
}

export interface TranslationType {
  _id?: ObjectIdSchema;
  locale?: LanguageISO6391;
  contexts?: TranslationContext[];
}

export interface TranslationValue {
  _id?: ObjectIdSchema;
  key?: string;
  value?: string;
}
