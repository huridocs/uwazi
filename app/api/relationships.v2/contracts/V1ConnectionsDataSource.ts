// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/ResultS... Remove this comment to see the full error message
import { ResultSet } from '../common.v2/contracts/ResultSet.js';

import { V1Connection, ReadableV1Connection } from '../model/V1Connection';

export interface V1ConnectionsDataSource {
  all(): ResultSet<V1Connection>;
  getConnectedToHubs(hubIds: string[]): ResultSet<ReadableV1Connection>;
  getSimilarConnections(connection: V1Connection): ResultSet<V1Connection>;
}
