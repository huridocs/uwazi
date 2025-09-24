import { ObjectId } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/ResultS... Remove this comment to see the full error message
import { ResultSet } from '../common.v2/contracts/ResultSet.js';

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
