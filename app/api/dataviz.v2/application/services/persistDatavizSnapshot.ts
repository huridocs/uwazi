import { computeNextScheduledAtIso } from '#shared/dataviz/computeNextLockedUntil.js';
import { buildManualDataDTO, isManualDataSource } from '#shared/dataviz/manualData.js';
import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { User } from '#api/users.v2/model/User.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import type { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import type { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import type { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { DatavizSnapshot } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import type { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';
import {
  buildRenderSnapshot,
  buildRenderSnapshotPayload,
  templateIdsFromQuery,
} from './buildRenderSnapshot.js';

type BuildSnapshotDeps = {
  queryExecutor: DatavizQueryExecutor;
  templatesDS: TemplatesDataSource;
};

type PersistSnapshotDeps = BuildSnapshotDeps & {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  transactionManager: TransactionManager;
};

type PersistDefinitionMode = 'create' | 'update';

const withSnapshotRefreshMetadata = (dataviz: Dataviz): Dataviz => {
  const refresh = {
    ...dataviz.refresh,
    lastRefreshedAt: new Date().toISOString(),
    ...(dataviz.isScheduled
      ? { nextScheduledAt: computeNextScheduledAtIso(dataviz.refresh) }
      : {}),
  };

  return new Dataviz({
    id: dataviz.id,
    name: dataviz.name,
    description: dataviz.description,
    dataSource: dataviz.dataSource,
    query: dataviz.query,
    manualData: dataviz.manualData,
    chart: dataviz.chart,
    appearance: dataviz.appearance,
    refresh,
    processing: { active: false },
    embedPublic: dataviz.embedPublic,
    createdAt: dataviz.createdAt,
    updatedAt: new Date(),
    skipValidation: true,
  });
};

const buildDatavizSnapshot = async (
  dataviz: Dataviz,
  actor: User,
  deps: BuildSnapshotDeps
): Promise<DatavizSnapshot> => {
  if (isManualDataSource(dataviz.dataSource)) {
    const data = buildManualDataDTO(dataviz.id, dataviz.manualData);
    return {
      datavizId: dataviz.id,
      queryHash: dataviz.queryHash,
      payload: buildRenderSnapshotPayload(dataviz, data),
      generatedAt: new Date(),
    };
  }

  validateQueryStructure(dataviz.query);

  const data = await deps.queryExecutor.execute(dataviz.query, {
    actor,
    datavizId: dataviz.id,
    appearance: dataviz.appearance,
  });

  const templateIds = templateIdsFromQuery(dataviz.query);
  const templates =
    templateIds.length > 0
      ? (await deps.templatesDS.getByIds(templateIds)).map(template => ({
          id: template.id,
          name: template.name,
          color: template.color,
        }))
      : [];

  return buildRenderSnapshot(dataviz, data, templates);
};

const persistDatavizSnapshot = async (
  dataviz: Dataviz,
  actor: User,
  deps: PersistSnapshotDeps,
  mode: PersistDefinitionMode
): Promise<{ dataviz: Dataviz; snapshotData: DatavizDataDTO }> => {
  const snapshot = await buildDatavizSnapshot(dataviz, actor, deps);
  const datavizWithRefresh = withSnapshotRefreshMetadata(dataviz);

  await deps.transactionManager.run(async () => {
    if (mode === 'create') {
      await deps.datavizDS.create(datavizWithRefresh);
    } else {
      await deps.datavizDS.update(datavizWithRefresh);
    }
    await deps.snapshotsDS.upsert(snapshot);
  });

  return { dataviz: datavizWithRefresh, snapshotData: snapshot.payload.data };
};

const persistDatavizSnapshotForRefresh = async (
  dataviz: Dataviz,
  actor: User,
  deps: PersistSnapshotDeps
): Promise<{ dataviz: Dataviz; snapshotData: DatavizDataDTO }> => {
  const snapshot = await buildDatavizSnapshot(dataviz, actor, deps);
  const datavizWithRefresh = withSnapshotRefreshMetadata(dataviz);

  await deps.transactionManager.run(async () => {
    await deps.snapshotsDS.upsert(snapshot);
    await deps.datavizDS.update(datavizWithRefresh);
  });

  return { dataviz: datavizWithRefresh, snapshotData: snapshot.payload.data };
};

export {
  buildDatavizSnapshot,
  persistDatavizSnapshot,
  persistDatavizSnapshotForRefresh,
  withSnapshotRefreshMetadata,
};
