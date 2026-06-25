import { computeNextScheduledAtIso } from '#shared/dataviz/computeNextLockedUntil.js';
import { buildManualDataDTO } from '#shared/dataviz/manualData.js';
import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { User } from '#api/users.v2/model/User.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import type { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import type { DatavizSnapshot } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
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

type SnapshotPersistencePlan = {
  snapshot: DatavizSnapshot;
  datavizWithRefresh: Dataviz;
  snapshotData: DatavizDataDTO;
};

const withSnapshotRefreshMetadata = (dataviz: Dataviz): Dataviz => {
  const refresh = {
    ...dataviz.refresh,
    lastRefreshedAt: new Date().toISOString(),
    ...(dataviz.isScheduled ? { nextScheduledAt: computeNextScheduledAtIso(dataviz.refresh) } : {}),
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
  if (dataviz.isManual) {
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

const planSnapshotPersistence = async (
  dataviz: Dataviz,
  actor: User,
  deps: BuildSnapshotDeps
): Promise<SnapshotPersistencePlan> => {
  const snapshot = await buildDatavizSnapshot(dataviz, actor, deps);
  const datavizWithRefresh = withSnapshotRefreshMetadata(dataviz);

  return { snapshot, datavizWithRefresh, snapshotData: snapshot.payload.data };
};

export { buildDatavizSnapshot, planSnapshotPersistence, withSnapshotRefreshMetadata };
export type { BuildSnapshotDeps, SnapshotPersistencePlan };
