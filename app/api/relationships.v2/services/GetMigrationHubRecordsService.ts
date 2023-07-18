import { MigrationHubRecordDataSource } from '../contracts/MigrationHubRecordDataSource';

class GetMigrationHubRecordsService {
  private hubRecordsDS: MigrationHubRecordDataSource;

  constructor(hubRecordsDS: MigrationHubRecordDataSource) {
    this.hubRecordsDS = hubRecordsDS;
  }

  async getPage(page: number, pageSize: number) {
    const hubRecords = await this.hubRecordsDS.getPage(page, pageSize);
    const fullCount = await this.hubRecordsDS.countAll();
    return { hubRecords, fullCount };
  }
}

export { GetMigrationHubRecordsService };
