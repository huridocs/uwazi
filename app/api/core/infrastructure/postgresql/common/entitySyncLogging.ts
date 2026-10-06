import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import type { AfterSyncLog } from './PostgresTable.js';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';
import { SyncLogWriter } from './SyncLogWriter.js';

const permissionOf = (accessContext: AccessContext) => {
  if (accessContext.isPrivileged()) {
    return { bypass: true, refIds: [] as string[] };
  }
  if (accessContext.isAnonymous()) {
    return { bypass: false, refIds: [] as string[] };
  }
  return { bypass: false, refIds: accessContext.refIds };
};

const entitySyncLogging = (deps: {
  transactionManager: PostgresTransactionManager;
  tenantId: string;
  accessContext: AccessContext;
}): { syncWriter: SyncLogWriter; afterSyncLog: AfterSyncLog } => {
  const permission = permissionOf(deps.accessContext);

  const afterSyncLog: AfterSyncLog = async (ids, deleted) => {
    if (deleted || ids.length === 0) return;

    const fileIds = await deps.transactionManager.withConnection(async trx => {
      const entityRows = await trx('entities').whereIn('_id', ids).select('sharedId');
      const sharedIds = [
        ...new Set(
          entityRows
            .map(row => row.sharedId as string | undefined)
            .filter((sharedId): sharedId is string => typeof sharedId === 'string')
        ),
      ];
      if (sharedIds.length === 0) return [];

      const fileRows = await trx('files').whereIn('entity', sharedIds).select('_id');
      return fileRows.map(row => row._id).filter((id): id is string => typeof id === 'string');
    }, permission);

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
