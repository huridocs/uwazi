import { ObjectId } from 'mongodb';

import { ResultSet } from 'api/common.v2/contracts/ResultSet';

import { V1Connection, V1ConnectionDisplayed } from '../model/V1Connection';

type V1ConnectionDBO = {
  _id: ObjectId;
  entity: string;
  hub: ObjectId;
  template: ObjectId;
};

type V1ConnectionDBOWithEntityInfo = V1ConnectionDBO & {
  entityTemplateId: ObjectId;
  entityTitle: string;
  templateName: string;
};

export interface V1ConnectionsDataSource {
  all(): ResultSet<V1Connection>;
  getConnectedToHubs(hubIds: string[]): ResultSet<V1ConnectionDisplayed>;
}

export type { V1ConnectionDBO, V1ConnectionDBOWithEntityInfo };
