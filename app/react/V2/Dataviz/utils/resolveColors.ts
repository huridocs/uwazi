import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DataPoint } from '#V2/Dataviz/types/data.js';

const DEFAULT_PALETTE = [
  '#4A90D9',
  '#7B68EE',
  '#E67E22',
  '#2ECC71',
  '#E74C3C',
  '#1ABC9C',
  '#9B59B6',
  '#F39C12',
];

export type ResolveColorContext = {
  templatesById?: Record<string, { color?: string }>;
  themePalette?: string[];
  index?: number;
};

const resolveFromData = (point: DataPoint, index: number, themePalette: string[]): string | undefined =>
  point.color || themePalette[index % themePalette.length];

const resolveTemplateColor = (
  point: DataPoint,
  templatesById: Record<string, { color?: string }> | undefined
): string | undefined => {
  const key = String(point.key);
  return templatesById?.[key]?.color;
};

export const resolvePointColor = (
  point: DataPoint,
  appearance: DatavizAppearance,
  context: ResolveColorContext = {}
): string => {
  const index = context.index ?? 0;
  const themePalette = context.themePalette?.length ? context.themePalette : DEFAULT_PALETTE;
  const key = String(point.key);

  if (appearance.colorMode === 'custom' && appearance.valueColorMap?.[key]) {
    return appearance.valueColorMap[key];
  }

  if (appearance.colorMode === 'template') {
    const templateColor = resolveTemplateColor(point, context.templatesById);
    if (templateColor) return templateColor;
  }

  if (appearance.colorMode === 'theme') {
    return themePalette[index % themePalette.length];
  }

  // from_data (default) and custom fallback
  const fromData = resolveFromData(point, index, themePalette);
  if (fromData) return fromData;

  if (appearance.colorMode === 'custom') {
    return themePalette[index % themePalette.length];
  }

  return themePalette[index % themePalette.length];
};

export const resolveSeriesColors = (
  points: DataPoint[],
  appearance: DatavizAppearance,
  context: ResolveColorContext = {}
): string[] =>
  points.map((point, index) =>
    resolvePointColor(point, appearance, { ...context, index })
  );
