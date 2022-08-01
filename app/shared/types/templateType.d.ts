/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';

export interface TemplateSchema {
  _id?: ObjectIdSchema;
  name: string;
  color?: string;
  default?: boolean;
  entityViewPage?: string;
  synced?: boolean;
  /**
   * @minItems 1
   */
  commonProperties?: [PropertySchema, ...PropertySchema[]];
  properties?: PropertySchema[];
  [k: string]: unknown | undefined;
}
