import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { ObjectId } from 'mongodb';
import { V1Connection } from '../model/V1Connection';

type V1ConnectionDBO = {
  _id: ObjectId;
  entity: string;
  hub: ObjectId;
  template: ObjectId;
};

export interface V1ConnectionsDataSource {
  allCursor(): MongoResultSet<V1ConnectionDBO, V1Connection>;
}

export type { V1ConnectionDBO };
