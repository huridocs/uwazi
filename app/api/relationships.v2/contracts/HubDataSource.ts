import { ObjectId } from 'mongodb';
import { ResultSet } from 'api/common.v2/contracts/ResultSet';

type HubType = {
  _id: ObjectId;
};

export interface HubDataSource {
  create(): Promise<void>;
  drop(): Promise<void>;
  insertIds(ids: string[]): Promise<void>;
  all(): ResultSet<string>;
}

export type { HubType };
