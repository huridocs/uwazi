import { ObjectId } from 'mongodb';

import { ResultSet } from 'api/common.v2/contracts/ResultSet';

import { V1Connection, V1ConnectionDisplayed } from '../model/V1Connection';

type V1ConnectionDBO = {
  _id: ObjectId;
  entity: string;
  hub: ObjectId;
  template?: ObjectId;
  file?: string;
  reference?: {
    text: string;
    selectionRectangles: {
      page: string;
      top: number;
      left: number;
      height: number;
      width: number;
    }[];
  };
};

type V1ConnectionDBOWithEntityInfo = V1ConnectionDBO & {
  entityTemplateId: ObjectId;
  entityTitle: string;
  templateName: string;
};

export interface V1ConnectionsDataSource {
  all(): ResultSet<V1Connection>;
  getConnectedToHubs(hubIds: string[]): ResultSet<V1ConnectionDisplayed>;
  getSimilarConnections(connection: V1Connection): ResultSet<V1Connection>;
}

export type { V1ConnectionDBO, V1ConnectionDBOWithEntityInfo };
