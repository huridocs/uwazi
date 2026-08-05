import type {
  DataPoint,
  DataSeries,
  DatavizAppearance,
  DatavizSource,
} from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';

export const DEFAULT_DATAVIZ_PALETTE = [
  '#4A90D9',
  '#7B68EE',
  '#E67E22',
  '#2ECC71',
  '#E74C3C',
  '#1ABC9C',
  '#9B59B6',
  '#F39C12',
];

export type TemplateColorMeta = {
  color?: string;
  name?: string;
};

const paletteAt = (palette: string[], index: number) => palette[index % palette.length]!;

const resolveTemplateColor = (
  key: string,
  templatesById: Record<string, TemplateColorMeta>
): string | undefined => templatesById[key]?.color;

const resolvePointColor = (
  point: DataPoint,
  appearance: DatavizAppearance,
  templatesById: Record<string, TemplateColorMeta>,
  index: number
): string | undefined => {
  const key = String(point.key);

  if (appearance.colorMode === 'custom' && appearance.valueColorMap?.[key]) {
    return appearance.valueColorMap[key];
  }

  if (appearance.colorMode === 'template') {
    const templateColor = resolveTemplateColor(key, templatesById);
    if (templateColor) {
      return templateColor;
    }
  }

  if (point.color && appearance.colorMode === 'from_data') {
    return point.color;
  }

  if (appearance.colorMode === 'theme' || appearance.colorMode === 'from_data') {
    return paletteAt(DEFAULT_DATAVIZ_PALETTE, index);
  }

  return appearance.colorMode === 'custom' ? paletteAt(DEFAULT_DATAVIZ_PALETTE, index) : undefined;
};

const bakePoints = (
  points: DataPoint[],
  appearance: DatavizAppearance,
  templatesById: Record<string, TemplateColorMeta>
): DataPoint[] =>
  points.map((point, index) => {
    const color = resolvePointColor(point, appearance, templatesById, index);
    const breakdown = point.breakdown
      ? bakePoints(point.breakdown, appearance, templatesById)
      : undefined;

    return {
      ...point,
      ...(color ? { color } : {}),
      ...(breakdown ? { breakdown } : {}),
    };
  });

const bakeSeriesLabels = (
  series: DataSeries[],
  sources: DatavizSource[],
  templatesById: Record<string, TemplateColorMeta>,
  primaryDimensionProperty?: string
): DataSeries[] => {
  const usesTemplateLabels =
    sources.length > 1 || primaryDimensionProperty === TEMPLATE_DIMENSION_PROPERTY;

  if (!usesTemplateLabels) {
    return series;
  }

  return series.map(item => {
    const source = sources.find(
      s => s.alias === item.id || s.alias === item.label || s.templateId === item.id
    );
    const templateName = source ? templatesById[source.templateId]?.name : undefined;
    if (!source || !templateName) {
      return item;
    }

    const sameTemplateCount = sources.filter(s => s.templateId === source.templateId).length;
    const label =
      sameTemplateCount > 1 && source.alias ? `${templateName} (${source.alias})` : templateName;

    return { ...item, label };
  });
};

export const bakeDatavizSnapshotColors = (
  series: DataSeries[],
  appearance: DatavizAppearance,
  templatesById: Record<string, TemplateColorMeta>,
  sources: DatavizSource[] = [],
  primaryDimensionProperty?: string
): DataSeries[] => {
  const withLabels = bakeSeriesLabels(series, sources, templatesById, primaryDimensionProperty);
  return withLabels.map(item => ({
    ...item,
    points: bakePoints(item.points, appearance, templatesById),
  }));
};

export const buildTemplatesById = (
  templates: Array<{ id: string; name: string; color?: string }>
): Record<string, TemplateColorMeta> =>
  Object.fromEntries(
    templates.map(template => [template.id, { name: template.name, color: template.color }])
  );
