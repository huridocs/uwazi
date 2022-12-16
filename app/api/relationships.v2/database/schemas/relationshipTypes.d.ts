/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdType } from 'api/common.v2/database/schemas/commonTypes';

export interface RelationshipDBOType {
  _id: ObjectIdType;
  from:
    | {
        entity: string;
        file: ObjectIdType;
        selections: {
          page: number;
          top: number;
          left: number;
          width: number;
          height: number;
        }[];
        text: string;
      }
    | {
        entity: string;
      };
  to:
    | {
        entity: string;
        file: ObjectIdType;
        selections: {
          page: number;
          top: number;
          left: number;
          width: number;
          height: number;
        }[];
        text: string;
      }
    | {
        entity: string;
      };
  type: ObjectIdType;
}
