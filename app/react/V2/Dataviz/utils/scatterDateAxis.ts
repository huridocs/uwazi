import type { DimensionSpec } from '#shared/types/datavizSchema.js';
import type { EChartsOption } from 'echarts';

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;
/** Unix seconds for 1980-01-01 — below this, treat numeric keys as calendar years. */
const UNIX_SECONDS_MIN = 315_532_800;

export type ScatterDateAxisMode = 'year';

export const isScatterYearKey = (key: unknown): key is number =>
  typeof key === 'number' &&
  Number.isFinite(key) &&
  Number.isInteger(key) &&
  key >= YEAR_MIN &&
  key <= YEAR_MAX;

export const isScatterUnixSecondsKey = (key: unknown): key is number =>
  typeof key === 'number' && Number.isFinite(key) && key >= UNIX_SECONDS_MIN;

export const resolveScatterDateAxisMode = (keys: unknown[]): ScatterDateAxisMode | undefined => {
  if (keys.some(isScatterUnixSecondsKey) || keys.some(isScatterYearKey)) {
    return 'year';
  }

  return undefined;
};

export const scatterDateKeyToAxisValue = (key: unknown): number | undefined => {
  if (isScatterUnixSecondsKey(key)) {
    const ms = key * 1000;
    const year = new Date(ms).getUTCFullYear();
    const yearStart = Date.UTC(year, 0, 1);
    const yearEnd = Date.UTC(year + 1, 0, 1);
    return year + (ms - yearStart) / (yearEnd - yearStart);
  }

  if (isScatterYearKey(key)) {
    return key;
  }

  const numeric = Number(key);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const computeYearAxisBounds = (years: number[]): { min?: number; max?: number } => {
  const finite = years.filter(Number.isFinite);
  if (!finite.length) {
    return {};
  }

  const minYear = Math.floor(Math.min(...finite));
  const maxYear = Math.ceil(Math.max(...finite));
  return { min: minYear - 0.5, max: maxYear + 0.5 };
};

export const formatYearOnlyAxisTick = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const year = Math.round(value);
  if (Math.abs(value - year) > 0.25) {
    return '';
  }

  return String(year);
};

type ScatterDateAxisOptions = {
  axisLabelColor?: string;
  name?: string;
  nameGap?: number;
  nameLocation?: 'start' | 'middle' | 'end';
  min?: number;
  max?: number;
};

export const buildScatterDateAxis = (
  options: ScatterDateAxisOptions
): NonNullable<EChartsOption['xAxis']> => {
  const { axisLabelColor, name, nameGap, nameLocation, min, max } = options;

  return {
    type: 'value',
    scale: true,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(name
      ? {
          name,
          nameGap,
          nameLocation: nameLocation ?? 'middle',
          nameTextStyle: { color: axisLabelColor },
        }
      : {}),
    axisLabel: {
      color: axisLabelColor,
      showMinLabel: true,
      showMaxLabel: true,
      hideOverlap: false,
      formatter: formatYearOnlyAxisTick,
    },
  };
};

export const resolveScatterDateDimensionPatch = (
  dimensions: DimensionSpec[],
  chartType: string
): DimensionSpec[] | null => {
  if (chartType !== 'scatter') {
    return null;
  }

  const primary = dimensions[0];
  if (!primary || primary.propertyType !== 'date' || primary.dateInterval === 'day') {
    return null;
  }

  return dimensions.map((dimension, index) =>
    index === 0
      ? {
          ...dimension,
          dateInterval: 'day' as const,
          sort: 'key_asc' as const,
        }
      : dimension
  );
};
