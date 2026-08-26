import { MigrationHubRecordDataSource } from '../contracts/MigrationHubRecordDataSource.js';

class GetMigrationHubRecordsService {
  private hubRecordsDS: MigrationHubRecordDataSource;

  constructor(hubRecordsDS: MigrationHubRecordDataSource) {
    this.hubRecordsDS = hubRecordsDS;
  }

  async getPage(page: number, pageSize: number) {
    const all = await this.hubRecordsDS.getAll().all();
    const hubRecords = all.slice((page - 1) * pageSize, page * pageSize);
    const fullCount = await this.hubRecordsDS.countAll();
    return { hubRecords, fullCount };
  }
}

export { GetMigrationHubRecordsService };
