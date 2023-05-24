import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { HubDataSource } from '../contracts/HubDataSource';
import { V1ConnectionsDataSource } from '../contracts/V1ConnectionsDataSource';

const HUB_BATCH_SIZE = 1000;

export class MigrationService {
  private transactionManager: MongoTransactionManager;

  private hubsDS: HubDataSource;

  private v1ConnectionsDS: V1ConnectionsDataSource;

  constructor(
    transactionManager: MongoTransactionManager,
    hubsDS: HubDataSource,
    v1ConnectionsDS: V1ConnectionsDataSource
  ) {
    this.transactionManager = transactionManager;
    this.hubsDS = hubsDS;
    this.v1ConnectionsDS = v1ConnectionsDS;
  }

  private async gatherHubs(limit?: number) {
    const cursor = this.v1ConnectionsDS.allCursor();

    let hubIds: Set<string> = new Set();
    // eslint-disable-next-line no-await-in-loop
    while ((await cursor.hasNext()) && (limit === undefined || hubIds.size < limit)) {
      // eslint-disable-next-line no-await-in-loop
      const connection = await cursor.next();
      if (connection) hubIds.add(connection.hub);
      if (hubIds.size >= HUB_BATCH_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        await this.hubsDS.insertIds(Array.from(hubIds));
        hubIds = new Set();
      }
    }
    await this.hubsDS.insertIds(Array.from(hubIds));
  }

  async migrate(dryRun: boolean) {
    console.log('request got in service');
    if (dryRun) {
      console.log('dry run');
    } else {
      console.log('not dry run, performing migration');
    }

    await this.hubsDS.create();

    await this.gatherHubs(20);

    // await this.hubsDS.drop();
  }
}
