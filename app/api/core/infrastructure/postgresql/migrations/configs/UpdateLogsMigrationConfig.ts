import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { copyUpdateLogs, mapUpdateLog } from './copyUpdateLogs.js';

export const UpdateLogsMigrationConfig: MigrationConfig & {
  copy: typeof copyUpdateLogs;
} = {
  mongoCollection: 'updatelogs',
  pgTable: 'updatelogs',
  conflictColumns: ['tenant_id', 'namespace', 'id'],
  mapDocument: mapUpdateLog,
  copy: copyUpdateLogs,
};
