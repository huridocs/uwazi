import { ObjectId } from 'mongodb';

export interface RelationshipDBO {
  _id: ObjectId;
  from: string;
  to: string;
  type: ObjectId;
}

export interface JoinedRelationshipDBO extends Omit<RelationshipDBO, 'from' | 'to'> {
  from: {
    sharedId: string;
    title: string;
  }[];
  to: {
    sharedId: string;
    title: string;
  }[];
}
