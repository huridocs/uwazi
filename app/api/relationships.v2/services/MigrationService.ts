import { Document } from 'mongodb';

import { TemporaryDataSource } from 'api/common.v2/contracts/TemporaryDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';

import { V1ConnectionsDataSource } from '../contracts/V1ConnectionsDataSource';

type TemporaryDataSourceFactoryType = <Schema extends Document>(
  name: string,
  transactionManager: MongoTransactionManager
) => TemporaryDataSource<Schema>;

type HubType = Document & {
  hubId: string;
};

export class MigrationService {
  private transactionManager: MongoTransactionManager;

  private TemporaryDataSourceFactory: TemporaryDataSourceFactoryType;

  private v1ConnectionsDS: V1ConnectionsDataSource;

  constructor(
    transactionManager: MongoTransactionManager,
    temporaryDataSourceClass: TemporaryDataSourceFactoryType,
    v1ConnectionsDS: V1ConnectionsDataSource
  ) {
    this.transactionManager = transactionManager;
    this.TemporaryDataSourceFactory = temporaryDataSourceClass;
    this.v1ConnectionsDS = v1ConnectionsDS;
  }

  private async gatherHubs(tempHubsCollection: TemporaryDataSource<HubType>, limit?: number) {
    const cursor = this.v1ConnectionsDS.allCursor();

    let count = 0;
    const connections = [];
    // eslint-disable-next-line no-await-in-loop
    while ((await cursor.hasNext()) && (limit === undefined || count < limit)) {
      // eslint-disable-next-line no-await-in-loop
      const connection = await cursor.next();
      connections.push(connection);
      count += 1;
    }
    console.log(connections)
  }

  async migrate(dryRun: boolean) {
    console.log('request got in service');
    if (dryRun) {
      console.log('dry run');
    } else {
      console.log('not dry run, performing migration');
    }

    const tempHubsCollection = this.TemporaryDataSourceFactory<HubType>(
      'hubs',
      this.transactionManager
    );
    await tempHubsCollection.create();

    await this.gatherHubs(tempHubsCollection, 5);

    await tempHubsCollection.drop();
  }
}
