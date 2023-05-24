import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { V1ConnectionsDataSource, V1ConnectionDBO } from '../contracts/V1ConnectionsDataSource';
import { V1Connection } from '../model/V1Connection';

const mapV1ConnectionsFromDBOToApp = (dbo: V1ConnectionDBO): V1Connection =>
  new V1Connection(dbo.entity, dbo.hub.toString(), dbo.template.toString());

export class MongoV1ConnectionsDataSource
  extends MongoDataSource<V1ConnectionDBO>
  implements V1ConnectionsDataSource
{//eslint-disable-line
  protected collectionName = 'connections';

  allCursor(): MongoResultSet<V1ConnectionDBO, V1Connection> {
    const cursor = this.getCollection().find({}, { session: this.getSession() });
    return new MongoResultSet<V1ConnectionDBO, V1Connection>(cursor, mapV1ConnectionsFromDBOToApp);
  }
}
