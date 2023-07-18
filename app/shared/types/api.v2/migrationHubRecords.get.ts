import { ReadableV1Connection } from './relationships.testOneHub';

type GetMigrationHubRecordsRequest = {
  page: number;
  pageSize: number;
};

type MigrationHubRecordResponse = {
  hubId: string;
  connections: ReadableV1Connection[];
};

type GetMigrationHubRecordsResponse = {
  hubRecords: MigrationHubRecordResponse[];
  fullCount: number;
};

export type {
  GetMigrationHubRecordsRequest,
  GetMigrationHubRecordsResponse,
  MigrationHubRecordResponse,
};
