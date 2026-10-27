import type { Knex } from 'knex';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { buildPermissionContext, type AfterSyncLog } from './PostgresTable.js';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';
import { SyncLogWriter } from './SyncLogWriter.js';
import { Statements } from './Statement.js';

const entitySyncLogging = (deps: {
  transactionManager: PostgresTransactionManager;
  tenantId: string;
  accessContext: AccessContext;
}): { syncWriter: SyncLogWriter; afterSyncLog: AfterSyncLog } => {
  const permission = buildPermissionContext(deps.accessContext);

  const afterSyncLog: AfterSyncLog = async (ids, deleted) => {
    if (deleted || ids.length === 0) return;

    const select = async (qb: Knex.QueryBuilder) =>
      (await deps.transactionManager.query(Statements.fromBuilder(qb, permission))).rows;

    const entityRows = await select(
      Statements.builder('entities').whereIn('_id', ids).select('sharedId')
    );
    const sharedIds = [
      ...new Set(
        entityRows
          .map(row => row.sharedId as string | undefined)
          .filter((sharedId): sharedId is string => typeof sharedId === 'string')
      ),
    ];
    if (sharedIds.length === 0) return;

    const fileRows = await select(
      Statements.builder('files').whereIn('entity', sharedIds).select('_id')
    );
    const fileIds = fileRows
      .map(row => row._id)
      .filter((id): id is string => typeof id === 'string');

    await new SyncLogWriter(deps.transactionManager, deps.tenantId, 'files').upsertSyncLogs(
      fileIds,
      false
    );
  };

  return {
    syncWriter: new SyncLogWriter(deps.transactionManager, deps.tenantId, 'entities'),
    afterSyncLog,
  };
};

export { entitySyncLogging };
