/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface IXExtractorType {
  _id?: ObjectIdSchema;
  extractorId: string;
  name: string;
  property: string;
  templates: ObjectIdSchema[];
}
