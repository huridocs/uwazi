import { ObjectId } from 'mongodb';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

type HubType = {
  _id: ObjectId;
};

export interface HubDataSource {
  exists(): Promise<boolean>;
  create(): Promise<void>;
  drop(): Promise<void>;
  insertIds(ids: string[]): Promise<void>;
  all(): MongoResultSet<HubType, string>;
}

export type { HubType };
