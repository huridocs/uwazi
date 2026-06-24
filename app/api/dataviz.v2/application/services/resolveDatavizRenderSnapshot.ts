import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';
import { filterDataForDisplay } from '#shared/dataviz/filterDataForDisplay.js';
import { buildManualDataDTO, isManualDataSource } from '#shared/dataviz/manualData.js';
import { buildRenderSnapshotPayload } from './buildRenderSnapshot.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import {
  DatavizNotFoundError,
  DatavizProcessingError,
  DatavizSnapshotUnavailableError,
} from '#api/dataviz.v2/domain/errors.js';
import type { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';

type Input = {
  dataviz: Dataviz;
  locale: LanguageISO6391;
  defaultLocale: LanguageISO6391;
};

type Deps = {
  snapshotsDS: DatavizSnapshotsDataSource;
};

const resolveDatavizRenderSnapshot = async (
  { dataviz, locale, defaultLocale }: Input,
  deps: Deps
): Promise<DatavizEmbedPayload> => {
  if (dataviz.processing?.active) {
    throw new DatavizProcessingError(dataviz.id);
  }

  if (isManualDataSource(dataviz.dataSource)) {
    const manualPayload = buildRenderSnapshotPayload(
      dataviz,
      buildManualDataDTO(dataviz.id, dataviz.manualData)
    );
    return {
      data: filterDataForDisplay(manualPayload.data, manualPayload.chart, {
        locale,
        defaultLocale,
      }),
      chart: manualPayload.chart,
      appearance: manualPayload.appearance,
    };
  }

  const snapshotResult = await deps.snapshotsDS.getByDatavizId(dataviz.id);
  if (snapshotResult.isError()) {
    throw new DatavizSnapshotUnavailableError(dataviz.id);
  }

  const snapshot = snapshotResult.getData();
  const renderPayload = snapshot.payload;
  const stale = snapshot.queryHash !== dataviz.queryHash;

  const data = filterDataForDisplay({ ...renderPayload.data, stale }, renderPayload.chart, {
    locale,
    defaultLocale,
    dimensions: dataviz.query.dimensions,
    measures: dataviz.query.measures,
  });

  return {
    data,
    chart: renderPayload.chart,
    appearance: renderPayload.appearance,
  };
};

const loadDatavizOrThrow = async (
  id: string,
  datavizDS: {
    getById: (id: string) => Promise<{ isError: () => boolean; getData: () => Dataviz }>;
  }
): Promise<Dataviz> => {
  const result = await datavizDS.getById(id);
  if (result.isError()) {
    throw new DatavizNotFoundError(id);
  }
  return result.getData();
};

export { resolveDatavizRenderSnapshot, loadDatavizOrThrow };
