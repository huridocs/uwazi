/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface IXExtractorType {
  _id: ObjectIdSchema;
  name: string;
  source: '__default_pdf' | string;
  property: string;
  templates: ObjectIdSchema[];
}
