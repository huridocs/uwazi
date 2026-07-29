/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/
import { FileType } from './fileType.js';

import { ObjectIdSchema } from '#shared/types/commonTypes.js';

import { EntitySchema } from '#shared/types/entityType.js';

export interface ConnectionSchema {
  _id?: ObjectIdSchema;
  __v?: number;
  hub?: ObjectIdSchema;
  template?: null | ObjectIdSchema;
  file?: ObjectIdSchema;
  entity?: string;
  entityData?: EntitySchema;
  reference?: {
    text: string;
    /**
     * @minItems 1
     */
    selectionRectangles: [
      {
        top: number;
        left: number;
        width: number;
        height: number;
        page: string;
      },
      ...{
        top: number;
        left: number;
        width: number;
        height: number;
        page: string;
      }[],
    ];
  };
}
