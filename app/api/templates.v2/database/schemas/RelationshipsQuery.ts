import { ObjectId } from 'mongodb';

export interface MatchQueryDBO {
  templates?: ObjectId[];
  sharedId?: string;
  traverse?: TraverseQueryDBO[];
}

export interface TraverseQueryDBO {
  direction: 'in' | 'out';
  types?: ObjectId[];
  match: MatchQueryDBO[];
}
