import type {
  DatavizChartConfig,
  DatavizAppearance,
  DatavizDataDTO,
  DatavizQuery,
  DatavizSnapshotRenderPayload,
} from '#shared/types/datavizSchema.js';
import type { DatavizSnapshot } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import {
  bakeDatavizSnapshotColors,
  buildTemplatesById,
} from '#shared/dataviz/bakeDatavizSnapshotColors.js';

export type { DatavizSnapshotRenderPayload };

export const buildRenderSnapshotPayload = (
  dataviz: Dataviz,
  data: DatavizDataDTO,
  templatesById: Record<string, { color?: string; name?: string }> = {}
): DatavizSnapshotRenderPayload => {
  const primaryDimension = dataviz.query.dimensions[0]?.property;
  const bakedSeries = bakeDatavizSnapshotColors(
    data.series,
    dataviz.appearance,
    templatesById,
    dataviz.query.sources,
    primaryDimension
  );

  return {
    data: { ...data, series: bakedSeries, stale: false },
    chart: dataviz.chart,
    appearance: dataviz.appearance,
  };
};

export const buildRenderSnapshot = (
  dataviz: Dataviz,
  data: DatavizDataDTO,
  templates: Array<{ id: string; name: string; color?: string }> = []
): DatavizSnapshot => ({
  datavizId: dataviz.id,
  queryHash: dataviz.queryHash,
  payload: buildRenderSnapshotPayload(dataviz, data, buildTemplatesById(templates)),
  generatedAt: new Date(),
});

export const templateIdsFromQuery = (query: DatavizQuery): string[] => [
  ...new Set(query.sources.map(source => source.templateId).filter(Boolean)),
];
