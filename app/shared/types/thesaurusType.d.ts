/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from '#shared/types/commonTypes.js';

export interface ThesaurusSchema {
  _id?: ObjectIdSchema;
  name: string;
  values?: ThesaurusValueSchema[];
  [k: string]: unknown | undefined;
}

export interface ThesaurusValueSchema {
  id?: string;
  label: string;
  values?: {
    id?: string;
    label: string;
    name?: string;
  }[];
}
