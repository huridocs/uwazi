/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface TranslationContext {
  _id?: ObjectIdSchema;
  id?: string;
  label?: string;
  type?: string;
  values?: TranslationValue[];
}

export interface TranslationType {
  _id?: ObjectIdSchema;
  locale?: string;
  contexts?: TranslationContext[];
}

export interface TranslationValue {
  _id?: ObjectIdSchema;
  key?: string;
  value?: string;
}
