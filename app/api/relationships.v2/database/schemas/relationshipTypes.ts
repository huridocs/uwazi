import { ObjectId } from 'mongodb';

export interface RelationshipDBOType {
  _id: ObjectId;
  from:
    | {
        entity: string;
        file: ObjectId;
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
        file: ObjectId;
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
  type: ObjectId;
}
