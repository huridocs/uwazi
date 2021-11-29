/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface IXModelType {
  _id?: ObjectIdSchema;
  propertyName: string;
  creationDate: number;
  status?: 'processing' | 'failed' | 'ready';
}
