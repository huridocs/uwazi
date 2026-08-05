import type {
  DatavizDataDTO,
  DatavizManualDataPayload,
  DatavizDataSourceKind,
} from '#shared/types/datavizSchema.js';

export const MANUAL_DATA_EXAMPLE: DatavizManualDataPayload = {
  series: [
    {
      id: 'main',
      label: 'Series 1',
      points: [
        { key: 'a', label: 'Category A', value: 10 },
        { key: 'b', label: 'Category B', value: 25 },
        { key: 'c', label: 'Category C', value: 15 },
      ],
    },
  ],
  meta: {
    totalEntities: 50,
    truncated: false,
  },
};

export const isManualDataSource = (dataSource?: DatavizDataSourceKind): boolean =>
  dataSource === 'manual';

export const buildManualDataDTO = (
  datavizId: string,
  manualData?: DatavizManualDataPayload
): DatavizDataDTO => {
  const series = manualData?.series ?? [];
  const totalFromMeta = manualData?.meta?.totalEntities;
  const totalEntities =
    totalFromMeta ??
    series.reduce(
      (sum, currentSeries) =>
        sum + currentSeries.points.reduce((pointSum, point) => pointSum + (point.value ?? 0), 0),
      0
    );

  return {
    datavizId,
    generatedAt: new Date().toISOString(),
    stale: false,
    meta: {
      totalEntities,
      truncated: manualData?.meta?.truncated ?? false,
    },
    series,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parsePoint = (value: unknown, index: number) => {
  if (!isRecord(value)) {
    throw new Error(`points[${index}] must be an object`);
  }
  if (typeof value.label !== 'string') {
    throw new Error(`points[${index}].label must be a string`);
  }
  if (typeof value.value !== 'number' || Number.isNaN(value.value)) {
    throw new Error(`points[${index}].value must be a number`);
  }
  return value;
};

const parseSeries = (value: unknown, index: number) => {
  if (!isRecord(value)) {
    throw new Error(`series[${index}] must be an object`);
  }
  if (typeof value.id !== 'string' || !value.id.trim()) {
    throw new Error(`series[${index}].id must be a non-empty string`);
  }
  if (typeof value.label !== 'string' || !value.label.trim()) {
    throw new Error(`series[${index}].label must be a non-empty string`);
  }
  if (!Array.isArray(value.points) || value.points.length === 0) {
    throw new Error(`series[${index}].points must be a non-empty array`);
  }
  value.points.forEach((point, pointIndex) => parsePoint(point, pointIndex));
  return value;
};

export const parseManualDataPayload = (value: unknown): DatavizManualDataPayload => {
  if (!isRecord(value)) {
    throw new Error('Manual data must be a JSON object');
  }
  if (!Array.isArray(value.series) || value.series.length === 0) {
    throw new Error('Manual data must include a non-empty "series" array');
  }
  value.series.forEach((series, index) => parseSeries(series, index));

  if (value.meta !== undefined && !isRecord(value.meta)) {
    throw new Error('"meta" must be an object when provided');
  }

  return value as DatavizManualDataPayload;
};

export const stringifyManualDataPayload = (manualData?: DatavizManualDataPayload): string =>
  JSON.stringify(manualData ?? MANUAL_DATA_EXAMPLE, null, 2);
