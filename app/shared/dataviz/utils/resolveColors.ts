import type { DatavizSource } from '#shared/types/datavizSchema.js';
import type { DatavizAppearance } from '#shared/types/datavizSchema.js';
import type { DataPoint } from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';

export const DEFAULT_CHART_PALETTE = [
  '#4A90D9',
  '#7B68EE',
  '#E67E22',
  '#2ECC71',
  '#E74C3C',
  '#1ABC9C',
  '#9B59B6',
  '#F39C12',
];

export type TemplateChartMeta = {
  color?: string;
  name?: string;
};

export type ResolveColorContext = {
  templatesById?: Record<string, TemplateChartMeta>;
  sources?: DatavizSource[];
  themePalette?: string[];
  index?: number;
};

const paletteAt = (palette: string[], index: number) => palette[index % palette.length]!;

const resolvePalette = (context: ResolveColorContext) =>
  context.themePalette?.length ? context.themePalette : DEFAULT_CHART_PALETTE;

const findSourceForSeries = (
  seriesId: string,
  seriesLabel: string,
  sources?: DatavizSource[]
): DatavizSource | undefined =>
  sources?.find(
    source =>
      source.alias === seriesId ||
      source.alias === seriesLabel ||
      source.templateId === seriesId ||
      source.templateId === seriesLabel
  );

const resolveTemplateColorForKey = (
  key: string,
  templatesById: Record<string, TemplateChartMeta> | undefined
): string | undefined => templatesById?.[key]?.color;

export const resolveCompareSeriesDisplayLabel = (
  seriesId: string,
  seriesLabel: string,
  context: ResolveColorContext = {}
): string => {
  const source = findSourceForSeries(seriesId, seriesLabel, context.sources);
  if (!source) {
    return seriesLabel;
  }

  const templateName = context.templatesById?.[source.templateId]?.name;
  if (!templateName) {
    return seriesLabel;
  }

  const sameTemplateSources =
    context.sources?.filter(item => item.templateId === source.templateId).length ?? 0;

  if (sameTemplateSources > 1 && source.alias) {
    return `${templateName} (${source.alias})`;
  }

  return templateName;
};

export const resolvePointColor = (
  point: DataPoint,
  appearance: DatavizAppearance,
  context: ResolveColorContext = {}
): string => {
  const index = context.index ?? 0;
  const palette = resolvePalette(context);
  const key = String(point.key);

  if (appearance.colorMode === 'custom') {
    const custom = appearance.valueColorMap?.[key] ?? appearance.valueColorMap?.[point.label];
    if (custom) {
      return custom;
    }
  }

  if (point.color) {
    return point.color;
  }

  if (appearance.colorMode === 'template') {
    const templateColor = resolveTemplateColorForKey(key, context.templatesById);
    if (templateColor) return templateColor;
  }

  return paletteAt(palette, index);
};

export const resolveCompareSeriesColor = (
  seriesId: string,
  seriesLabel: string,
  appearance: DatavizAppearance,
  context: ResolveColorContext = {},
  index = 0
): string => {
  const palette = resolvePalette(context);

  if (appearance.colorMode === 'custom') {
    const displayLabel = resolveCompareSeriesDisplayLabel(seriesId, seriesLabel, context);
    const custom =
      appearance.valueColorMap?.[seriesId] ??
      appearance.valueColorMap?.[seriesLabel] ??
      appearance.valueColorMap?.[displayLabel];
    if (custom) return custom;
  }

  if (appearance.colorMode === 'template' && context.sources?.length) {
    const source = findSourceForSeries(seriesId, seriesLabel, context.sources);
    const templateColor = source
      ? resolveTemplateColorForKey(source.templateId, context.templatesById)
      : undefined;
    if (templateColor) return templateColor;
  }

  return paletteAt(palette, index);
};

export const resolveSeriesColors = (
  points: DataPoint[],
  appearance: DatavizAppearance,
  context: ResolveColorContext = {}
): string[] =>
  points.map((point, index) => resolvePointColor(point, appearance, { ...context, index }));

export const usesTemplateSeriesColors = (
  appearance: DatavizAppearance,
  sources: DatavizSource[] | undefined,
  primaryDimensionProperty?: string
): boolean =>
  appearance.colorMode === 'template' &&
  Boolean(
    (sources && sources.length > 1) || primaryDimensionProperty === TEMPLATE_DIMENSION_PROPERTY
  );
