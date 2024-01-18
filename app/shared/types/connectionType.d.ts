/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/
import { FileType } from 'shared/types/fileType';

import { ObjectIdSchema } from 'shared/types/commonTypes';

import { EntitySchema } from 'shared/types/entityType';

export interface ConnectionSchema {
  _id?: ObjectIdSchema;
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
      }[]
    ];
  };
}
