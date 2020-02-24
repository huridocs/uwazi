/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';

export interface TemplateSchema {
  _id?: ObjectIdSchema;
  name: string;
  color?: string;
  default?: boolean;
  commonProperties: [PropertySchema, ...PropertySchema[]];
  properties?: PropertySchema[];
  [k: string]: any | undefined;
}
