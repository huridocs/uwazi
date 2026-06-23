import type { EChartsOption } from 'echarts';
import { formatDatavizNumericLabel } from '#shared/dataviz/formatDimensionKeyLabel.js';

type ValueAxisOptions = {
  axisLabelColor?: string;
  name?: string;
  nameGap?: number;
  nameLocation?: 'start' | 'middle' | 'end';
  nameRotate?: number;
  min?: number;
  max?: number;
  /** When true, axis range fits data and need not include zero. */
  scale?: boolean;
  formatTick?: (value: number) => string;
};

export const computePaddedAxisBounds = (
  values: number[],
  paddingRatio = 0.08
): { min?: number; max?: number } => {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) {
    return {};
  }

  const min = Math.min(...finite);
  const max = Math.max(...finite);

  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 0.5);
    return { min: min - pad, max: max + pad };
  }

  const span = max - min;
  const pad = span * paddingRatio;
  return { min: min - pad, max: max + pad };
};

export const formatValueAxisTick = (value: number): string => {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  if (Number.isInteger(value) && Math.abs(value) >= 100) {
    return String(value);
  }

  return formatDatavizNumericLabel(value);
};

export const buildValueAxis = (
  options: ValueAxisOptions = {}
): Extract<NonNullable<EChartsOption['xAxis']>, { type?: string }> => {
  const { axisLabelColor, name, nameGap, nameLocation, nameRotate, min, max, scale = false, formatTick } =
    options;

  return {
    type: 'value',
    ...(scale ? { scale: true } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(name
      ? {
          name,
          nameGap,
          nameLocation: nameLocation ?? 'middle',
          ...(nameRotate !== undefined ? { nameRotate } : {}),
          nameTextStyle: { color: axisLabelColor },
        }
      : {}),
    axisLabel: {
      color: axisLabelColor,
      ...(formatTick ? { formatter: (value: number) => formatTick(value) } : {}),
    },
  };
};
