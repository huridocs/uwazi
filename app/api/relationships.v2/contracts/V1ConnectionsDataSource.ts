import { ResultSet } from '#api/core/application/contracts/ResultSet.js';

import { V1Connection, ReadableV1Connection } from '#api/relationships.v2/model/V1Connection.js';

export interface V1ConnectionsDataSource {
  all(): ResultSet<V1Connection>;
  getConnectedToHubs(hubIds: string[]): ResultSet<ReadableV1Connection>;
  getSimilarConnections(connection: V1Connection): ResultSet<V1Connection>;
}
