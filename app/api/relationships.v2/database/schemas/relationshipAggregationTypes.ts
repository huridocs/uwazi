import { ObjectId } from 'mongodb';

export interface EntityInfoType {
  sharedId: string;
  title: string;
  [k: string]: unknown | undefined;
}

export interface JoinedRelationshipDBOType {
  _id: ObjectId;
  from: EntityInfoType[];
  to: EntityInfoType[];
  type: ObjectId;
}
