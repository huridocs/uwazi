import { ReadableV1Connection } from '#shared/types/api.v2/relationships.testOneHub.js';

type GetMigrationHubRecordsRequest = {
  page: string;
  pageSize: string;
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
