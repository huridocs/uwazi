import type { DataPoint, DataSeries, DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { resolveLocalizedLabel } from './resolveLocalizedLabel.js';

const projectPoint = (
  point: DataPoint,
  locale: string,
  defaultLocale: string
): DataPoint => ({
  ...point,
  label: resolveLocalizedLabel(point, locale, defaultLocale),
  breakdown: point.breakdown?.map(item => projectPoint(item, locale, defaultLocale)),
});

const projectSeries = (
  series: DataSeries,
  locale: string,
  defaultLocale: string
): DataSeries => ({
  ...series,
  label: resolveLocalizedLabel(series, locale, defaultLocale),
  points: series.points.map(point => projectPoint(point, locale, defaultLocale)),
});

export const projectDatavizLabelsForLocale = (
  data: DatavizDataDTO,
  locale: string,
  defaultLocale: string = locale
): DatavizDataDTO => ({
  ...data,
  series: data.series.map(series => projectSeries(series, locale, defaultLocale)),
});
