import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { V1ConnectionsDataSource, V1ConnectionDBO } from '../contracts/V1ConnectionsDataSource';
import { V1Connection } from '../model/V1Connection';

const mapHubsFromDBOToApp = (dbo: V1ConnectionDBO): V1Connection => ({
  entity: dbo.entity,
  hub: dbo.hub.toHexString(),
  template: dbo.template.toHexString(),
});

export class MongoV1ConnectionsDataSource
  extends MongoDataSource<V1ConnectionDBO>
  implements V1ConnectionsDataSource
{//eslint-disable-line
  protected collectionName = 'connections';

  allCursor(): MongoResultSet<V1ConnectionDBO, V1Connection> {
    const cursor = this.getCollection().find({}, { session: this.getSession() });
    return new MongoResultSet<V1ConnectionDBO, V1Connection>(cursor, mapHubsFromDBOToApp);
  }
}
