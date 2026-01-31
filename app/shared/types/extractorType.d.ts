/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from '#shared/types/commonTypes.js';

export interface IXExtractorType {
  _id: ObjectIdSchema;
  name: string;
  source: {
    pdf?: boolean;
    property?: string;
  };
  property: string;
  templates: ObjectIdSchema[];
}
