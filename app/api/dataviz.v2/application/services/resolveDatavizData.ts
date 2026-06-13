import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { DatavizDataDTO, DatavizQuery } from '#shared/types/datavizSchema.js';
import { DATAVIZ_DRAFT_ID } from '#shared/types/datavizSchema.js';
import { buildManualDataDTO, isManualDataSource } from '#shared/dataviz/manualData.js';
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

export type ResolveDatavizDataOptions = {
  allowLiveQuery: boolean;
  requirePublished: boolean;
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
  language: LanguageISO6391;
};

const tryReadSnapshot = async (
  id: string,
  dataviz: Dataviz,
  snapshotsDS: DatavizSnapshotsDataSource,
  options: ResolveDatavizDataOptions
): Promise<DatavizDataDTO | undefined> => {
  const snapshotResult = await snapshotsDS.getByDatavizId(id);
  if (snapshotResult.isOk()) {
    const snapshot = snapshotResult.getData();
    if (snapshot.queryHash === dataviz.queryHash) {
      return { ...snapshot.payload, stale: false };
    }
    return { ...snapshot.payload, stale: true };
  }

  if (!options.allowLiveQuery && dataviz.refresh.refreshMode === 'live') {
    throw new DatavizSnapshotUnavailableError(id);
  }

  return undefined;
};

const resolveDatavizData = async (
  input: ResolveInput,
  deps: ResolveDatavizDataDeps
): Promise<DatavizDataDTO> => {
  const { id, dataviz, draftQuery, options, actor, language } = input;
  const isPreview = Boolean(draftQuery);

  if (options.requirePublished && dataviz.status !== 'published') {
    throw new DatavizNotFoundError(id);
  }

  if (dataviz.processing?.active && !isPreview) {
    throw new DatavizProcessingError(id);
  }

  if (isManualDataSource(dataviz.dataSource)) {
    return buildManualDataDTO(id, dataviz.manualData);
  }

  const query = draftQuery ?? dataviz.query;
  const shouldTrySnapshot = !isPreview && (!options.allowLiveQuery || dataviz.refresh.refreshMode !== 'live');

  if (shouldTrySnapshot) {
    const snapshotData = await tryReadSnapshot(id, dataviz, deps.snapshotsDS, options);
    if (snapshotData) {
      return snapshotData;
    }
  }

  validateQueryStructure(query);

  return deps.queryExecutor.execute(query, {
    actor,
    language,
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
