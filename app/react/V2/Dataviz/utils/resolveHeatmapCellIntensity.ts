export const HEATMAP_MIN_POSITIVE_INTENSITY = 0.22;

export const resolveHeatmapCellIntensity = (value: number, maxValue: number): number => {
  if (value <= 0) {
    return 0;
  }
  if (maxValue <= 0) {
    return HEATMAP_MIN_POSITIVE_INTENSITY;
  }

  const normalized = Math.min(1, value / maxValue);
  return HEATMAP_MIN_POSITIVE_INTENSITY + (1 - HEATMAP_MIN_POSITIVE_INTENSITY) * normalized;
};
