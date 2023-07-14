import { ResultSet } from 'api/common.v2/contracts/ResultSet';

import { V1Connection, ReadableV1Connection } from '../model/V1Connection';

export interface V1ConnectionsDataSource {
  all(): ResultSet<V1Connection>;
  getConnectedToHubs(hubIds: string[]): ResultSet<ReadableV1Connection>;
  getSimilarConnections(connection: V1Connection): ResultSet<V1Connection>;
}
