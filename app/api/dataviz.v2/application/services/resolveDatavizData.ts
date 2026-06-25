import type { DatavizDataDTO, DatavizQuery } from '#shared/types/datavizSchema.js';
import { DATAVIZ_DRAFT_ID } from '#shared/types/datavizSchema.js';
import { buildManualDataDTO } from '#shared/dataviz/manualData.js';
import { User } from '#api/users.v2/model/User.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import {
  DatavizNotFoundError,
  DatavizProcessingError,
  DatavizSnapshotUnavailableError,
} from '#api/dataviz.v2/domain/errors.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';
import type { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import type { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import type { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { DatavizSnapshot } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';

export type ResolveDatavizDataMode = 'authoring' | 'render';

export type ResolveDatavizDataOptions = {
  mode: ResolveDatavizDataMode;
};

export type ResolveDatavizDataDeps = {
  datavizDS: DatavizDataSource;
  snapshotsDS: DatavizSnapshotsDataSource;
  queryExecutor: DatavizQueryExecutor;
};

type ResolveInput = {
  id: string;
  dataviz: Dataviz;
  draftQuery?: DatavizQuery;
  options: ResolveDatavizDataOptions;
  actor: User;
};

const extractSnapshotData = (snapshot: DatavizSnapshot, dataviz: Dataviz): DatavizDataDTO => {
  const stale = snapshot.queryHash !== dataviz.queryHash;
  return { ...snapshot.payload.data, stale };
};

const tryReadSnapshot = async (
  id: string,
  dataviz: Dataviz,
  snapshotsDS: DatavizSnapshotsDataSource,
  options: ResolveDatavizDataOptions
): Promise<DatavizDataDTO | undefined> => {
  const snapshotResult = await snapshotsDS.getByDatavizId(id);
  if (snapshotResult.isOk()) {
    return extractSnapshotData(snapshotResult.getData(), dataviz);
  }

  if (options.mode === 'render') {
    throw new DatavizSnapshotUnavailableError(id);
  }

  return undefined;
};

const resolveDatavizData = async (
  input: ResolveInput,
  deps: ResolveDatavizDataDeps
): Promise<DatavizDataDTO> => {
  const { id, dataviz, draftQuery, options, actor } = input;
  const isPreview = Boolean(draftQuery);

  if (dataviz.processing?.active && !isPreview) {
    throw new DatavizProcessingError(id);
  }

  if (dataviz.isManual) {
    return buildManualDataDTO(id, dataviz.manualData);
  }

  const query = draftQuery ?? dataviz.query;
  const shouldTrySnapshot =
    !isPreview && (options.mode === 'render' || dataviz.refresh.refreshMode !== 'live');

  if (shouldTrySnapshot) {
    const snapshotData = await tryReadSnapshot(id, dataviz, deps.snapshotsDS, options);
    if (snapshotData) {
      return snapshotData;
    }
  }

  if (options.mode === 'render') {
    throw new DatavizSnapshotUnavailableError(id);
  }

  validateQueryStructure(query);

  return deps.queryExecutor.execute(query, {
    actor,
    datavizId: id,
    appearance: dataviz.appearance,
  });
};

const loadDatavizForData = async (
  id: string,
  isPreview: boolean,
  datavizDS: DatavizDataSource
): Promise<Dataviz | undefined> => {
  if (id === DATAVIZ_DRAFT_ID) {
    if (!isPreview) {
      throw new DatavizNotFoundError(id);
    }
    return undefined;
  }

  const datavizResult = await datavizDS.getById(id);
  if (datavizResult.isError()) {
    if (!isPreview) {
      throw new DatavizNotFoundError(id);
    }
    return undefined;
  }

  return datavizResult.getData();
};

export { resolveDatavizData, loadDatavizForData };
